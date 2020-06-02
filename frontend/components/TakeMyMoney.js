import React from "react";
import StrpeCheckout from "react-stripe-checkout";
import { Mutation } from "react-apollo";
import Router from "next/router";
import NProgress from "nprogress";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import calcTotalPrice from "../lib/calcTotalPrice";
import Error from "./ErrorMessage";
import User, { CURRENT_USER_QUERY } from "./User";

const CREATE_ORDER_MUTATION = gql`
  mutation CREATE_ORDER_MUTATION($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;

function totalItems(cart) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

class TakeMyMoney extends React.Component {
  onToken = async (res, createOrder) => {
    NProgress.start();
    const order = await createOrder({
      variables: {
        token: res.id
      }
    }).catch(err => alert(err.message));

    Router.push({
      pathname: "/order",
      query: { id: order.data.createOrder.id }
    });
  };
  render() {
    return (
      <User>
        {({ data: { me } }) => (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={[{ query: CURRENT_USER_QUERY }]}
          >
            {createOrder => (
              <StrpeCheckout
                amount={calcTotalPrice(me.cart)}
                currency={"KRW"}
                name="Trip Beer"
                description={`Order of ${totalItems(me.cart)} Items!`}
                image={
                  me.cart.length && me.cart[0].item ? me.cart[0].item.image : ""
                }
                stripeKey="pk_test_A4dXbN1Z8BBB5584KGj02AOy0002NCGV3J"
                email={me.email}
                token={res => this.onToken(res, createOrder)}
              >
                {this.props.children}
              </StrpeCheckout>
            )}
          </Mutation>
        )}
      </User>
    );
  }
}

export default TakeMyMoney;
