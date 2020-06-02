import React from "react";
import { Mutation } from "react-apollo";
import { TOGGLE_CART_OPEN_MUTATION } from "../components/Cart";
import Link from "next/link";
import NavStyles from "./styles/NavStyles";
import User from "./User";
import Signout from "./Signout";
import CartCount from "./CartCount";

const Nav = () => (
  <User>
    {({ data: { me } }) => (
      <NavStyles>
        <Link href="/items">
          <a>Shop</a>
        </Link>
        {me ? (
          <>
            <Link href="/sell">
              <a>Sell</a>
            </Link>
            <Link href="/orders">
              <a>Orders</a>
            </Link>
            <Link href="/me">
              <a>Account</a>
            </Link>
            <Mutation mutation={TOGGLE_CART_OPEN_MUTATION}>
              {toggleCart => (
                <button onClick={toggleCart}>
                  Cart
                  <CartCount
                    count={me.cart.reduce(
                      (total, item) => total + item.quantity,
                      0
                    )}
                  />
                </button>
              )}
            </Mutation>
            <Signout>Sign out</Signout>
          </>
        ) : (
          <Link href="/signup">
            <a>Sign in</a>
          </Link>
        )}
      </NavStyles>
    )}
  </User>
);

export default Nav;
