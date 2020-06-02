import React, { Component } from "react";
import gql from "graphql-tag";
import { Mutation } from "react-apollo";
import styled from "styled-components";
import PropTypes from "prop-types";
import { CURRENT_USER_QUERY } from "./User";

const REMOVE_FROM_CART_MUTATION = gql`
  mutation REMOVE_FROM_CART_MUTATION($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;

const RemoveButton = styled.button`
  font-size: 3rem;
  background: none;
  border: 0;
  &:hover {
    cursor: pointer;
    color: ${props => props.theme.blue};
  }
`;

class RemoveFromCart extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  };

  update = (cache, payload) => {
    console.log("update Fn");
    const data = cache.readQuery({
      query: CURRENT_USER_QUERY
    });
    data.me.cart = data.me.cart.filter(
      cartItem => cartItem.id !== payload.data.removeFromCart.id
    );
    cache.writeQuery({
      query: CURRENT_USER_QUERY,
      data
    });
  };

  render() {
    return (
      <Mutation
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
        optimisticResponse={{
          __typename: "Mutation",
          removeFromCart: {
            __typename: "Cart",
            id: this.props.id
          }
        }}
      >
        {(removeFromCart, { loading }) => (
          <RemoveButton
            title="Delete Item"
            onClick={() => {
              removeFromCart().catch(err => alert(err.message));
            }}
            disabled={loading}
          >
            &times;
          </RemoveButton>
        )}
      </Mutation>
    );
  }
}
export default RemoveFromCart;
