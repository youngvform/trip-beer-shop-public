import React from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import { adopt } from "react-adopt";
import User from "./User";
import CartStyles from "./styles/CartStyles";
import Supreme from "./styles/Supreme";
import CloseButton from "./styles/CloseButton";
import RedButton from "./styles/RedButton";
import CartItem from "./CartItem";
import calcTotalPrice from "../lib/calcTotalPrice";
import formatMoney from "../lib/formatMoney";
import TakeMyMoney from "./TakeMyMoney";

const LOCAL_STATE_QUERY = gql`
  query LOCAL_STATE_QUERY {
    cartOpen @client
  }
`;

const TOGGLE_CART_OPEN_MUTATION = gql`
  mutation TOGGLE_CART_OPEN_MUTATION {
    toggleCart @client
  }
`;

const Compose = adopt({
  user: ({ render }) => <User>{render}</User>,
  toggleCart: ({ render }) => (
    <Mutation mutation={TOGGLE_CART_OPEN_MUTATION}>{render}</Mutation>
  ),
  localState: ({ render }) => <Query query={LOCAL_STATE_QUERY}>{render}</Query>
});

const Cart = () => (
  <Compose>
    {({ user, toggleCart, localState }) => {
      const me = user.data.me;
      if (!me) return null;
      console.log(me);
      return (
        <CartStyles open={localState.data.cartOpen}>
          <header>
            <CloseButton onClick={toggleCart} title="close">
              &times;
            </CloseButton>
            <Supreme>{me.name}'s Cart</Supreme>
            <p>
              You have{" "}
              {me.cart.reduce((total, item) => total + item.quantity, 0)} item
              {me.cart.length > 1 && "s"} in your cart.
            </p>
          </header>
          <ul>
            {me.cart.map(cartItem => (
              <CartItem key={cartItem.id} cartItem={cartItem} />
            ))}
          </ul>
          <footer>
            <p>{formatMoney(calcTotalPrice(me.cart))}</p>
            {me.cart.length ? (
              <TakeMyMoney>
                <RedButton>Checkout</RedButton>
              </TakeMyMoney>
            ) : null}
          </footer>
        </CartStyles>
      );
    }}
  </Compose>
);

export default Cart;
export { LOCAL_STATE_QUERY, TOGGLE_CART_OPEN_MUTATION };
