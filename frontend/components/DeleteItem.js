import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { ALL_ITEMS_QUERY } from "./Items";

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    deleteItem(id: $id) {
      id
    }
  }
`;

class DeleteItem extends Component {
  update = (cache, payload) => {
    // manually update cache

    // 1. read items from cache
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY });

    // 2. filter deleted item
    data.items = data.items.filter(
      item => item.id !== payload.data.deleteItem.id
    );

    // 3. put the items tox cache
    cache.writeQuery({ query: ALL_ITEMS_QUERY, data });
  };
  render() {
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id: this.props.id }}
        update={this.update}
      >
        {(deleteItem, { loading, error }) => {
          if (loading) return <p>LOADING....</p>;
          if (error) return alert(`EROOR is ${error.message}`);

          return (
            <button
              onClick={e => {
                if (confirm("Do you want to delete?")) {
                  deleteItem();
                }
              }}
            >
              {this.props.children}
            </button>
          );
        }}
      </Mutation>
    );
  }
}

export default DeleteItem;
