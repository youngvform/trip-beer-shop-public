const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, templatedEmail } = require("../mail");
const { hasPermission } = require("../utils");
const stripe = require("../stripe");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // info have return result of query so info is what data return to client
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that!");
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        }
      },
      info
    );

    return item;
  },

  async updateItem(parent, args, ctx, info) {
    const { id } = args;
    const updatedItem = {
      ...args
    };
    delete updatedItem.id;
    return await ctx.db.mutation.updateItem(
      { data: updatedItem, where: { id } },
      info
    );
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    const item = await ctx.db.query.item({ where }, `{ id title user { id }}`);

    const isOwner = item.user.id === ctx.request.id;
    const isHasPermission = ctx.request.user.permissions.some(perm =>
      ["ADMIN", "ITEMDELETE"].includes(perm)
    );

    if (!isOwner && !isHasPermission) {
      throw new Error("You are not allowed!");
    }

    return await ctx.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    // hash password
    const password = await bcrypt.hash(args.password, 10);

    // do mutation
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] }
        }
      },
      info
    );

    // create jwt
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // set the jwt as a cookie on response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // cookie lasts in 1 year
    });

    return user;
  },

  async signin(parent, { email, password }, ctx, info) {
    const user = await ctx.db.query.user({ where: { email } });

    if (!user) {
      throw new Error(`not found for email: ${email}`);
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new Error(`incorrect password`);
    }

    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // cookie lasts in 1 year
    });

    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");

    return { message: "Successfully Sign out!" };
  },
  async requestReset(parent, args, ctx, info) {
    const { email } = args;
    const user = await ctx.db.query.user({ where: { email } });

    if (!user) {
      throw new Error(`not found for email: ${email}`);
    }

    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1hour

    const res = await ctx.db.mutation.updateUser({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    try {
      const resetEmail = await transport.sendMail({
        from: "tripbeer@tripbeer.com",
        to: user.email,
        subject: "Reset Your Password",
        html: templatedEmail(`
          You can reset your password\n\n
          <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
            Click to Reset Password
          </a>
        `)
      });
    } catch (e) {
      throw new Error(`We couldn't send a email for ${e}`);
    }

    return { message: "We sent to you a mail to reset" };
  },
  async resetPassword(parent, args, ctx, info) {
    if (args.password !== args.confirmPassword) {
      return new Error("The passwords do not match.");
    }

    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });

    if (!user) {
      throw new Error("Your link is invalid.");
    }
    const password = await bcrypt.hash(args.password, 10);

    const updatedUser = await ctx.db.mutation.updateUser({
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      },
      where: { id: user.id }
    });

    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);

    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // cookie lasts in 1 year
    });

    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to do that!");
    }
    const user = await ctx.db.query.user(
      { where: { id: ctx.request.userId } },
      info
    );

    hasPermission(user, ["ADMIN", "PERMISSIONUPDATE"]);

    const updatedUser = await ctx.db.mutation.updateUser(
      {
        data: {
          permissions: { set: args.permissions }
        },
        where: { id: args.userId }
      },
      info
    );

    return updatedUser;
  },
  async addToCart(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be logged in to do that!");
    }

    const [existingItem] = await ctx.db.query.carts(
      {
        where: {
          user: { id: userId },
          item: { id: args.id }
        }
      },
      info
    );

    if (existingItem) {
      return ctx.db.mutation.updateCart(
        {
          where: {
            id: existingItem.id
          },
          data: {
            quantity: existingItem.quantity + 1
          }
        },
        info
      );
    }

    return ctx.db.mutation.createCart(
      {
        data: {
          user: {
            connect: {
              id: userId
            }
          },
          item: {
            connect: {
              id: args.id
            }
          }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    const { userId } = ctx.request;

    const existingItem = await ctx.db.query.cart(
      {
        where: {
          id: args.id
        }
      },
      "{ id user { id }}"
    );

    if (!existingItem) {
      throw new Error("No Item Found.");
    }

    if (existingItem.user.id !== userId) {
      throw new Error("Not your Item.");
    }

    return ctx.db.mutation.deleteCart(
      {
        where: {
          id: existingItem.id
        }
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error("You must be logged in to do that!");
    }

    const user = await ctx.db.query.user(
      {
        where: {
          id: userId
        }
      },
      `
      {
        id
        name
        email
        cart {
          id
          quantity
          item {
            id
            title
            price
            description
            image 
            largeImage
          }
        }
      }
    `
    );

    const amount = user.cart.reduce(
      (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
      0
    );

    const charge = await stripe.charges.create({
      amount,
      currency: "KRW",
      source: args.token
    });

    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: {
          connect: {
            id: userId
          }
        }
      };

      delete orderItem.id;
      return orderItem;
    });

    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } }
      }
    });

    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCarts({
      where: {
        id_in: cartItemIds
      }
    });

    return order;
  }

  // createDog(parent, args, ctx, info) {
  //   global.dogs = global.dogs || [];
  //   const newDog = { name: args.name };
  //   global.dogs.push(newDog);
  //   return newDog;
  // }
};

module.exports = Mutations;
