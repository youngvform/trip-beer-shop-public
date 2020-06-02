import React, { Component } from "react";
import gql from "graphql-tag";
import { Query, Mutation } from "react-apollo";
import Router from "next/router";
import Form from "./styles/Form";
import formatMoney from "../lib/formatMoney";
import Error from "./ErrorMessage.js";

const UPDATE_ITEM_MUTATION = gql`
  mutation UPDATE_ITEM_MUTATION(
    $id: ID!
    $title: String
    $description: String
    $price: Int
    $image: String
    $largeImage: String
  ) {
    updateItem(
      id: $id
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
    ) {
      id
    }
  }
`;

const SINGLE_ITEM_QUERY = gql`
  query SINGLE_ITEM_QUERY($id: ID!) {
    item(where: { id: $id }) {
      title
      description
      price
      image
      largeImage
    }
  }
`;

class UpdateItem extends Component {
  state = {};

  handleChange = e => {
    const { name, type, value } = e.target;
    const val = type === "number" && value ? parseFloat(value) : value;
    this.setState({
      [name]: val
    });
  };

  uploadFile = async e => {
    const files = e.target.files;
    const data = new FormData();
    data.append("file", files[0]);
    data.append("upload_preset", "tripbeer");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dx9mt7yfw/image/upload",
      {
        method: "POST",
        body: data
      }
    );
    const file = await res.json();

    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url
    });
  };

  updateItem = async (e, updateItemMutation) => {
    e.preventDefault();
    const res = await updateItemMutation({
      variables: {
        id: this.props.id,
        ...this.state
      }
    });

    Router.push({
      pathname: "/item",
      query: { id: res.data.updateItem.id }
    });
  };
  render() {
    const { id } = this.props;
    return (
      <Query query={SINGLE_ITEM_QUERY} variables={{ id }}>
        {({ data, error, loading }) => {
          if (loading) return <p>LOADING...</p>;
          if (error) return <p>ERROR {error.message}</p>;
          if (!data.item) return <p>No Data When ID is {id}</p>;
          return (
            <Mutation mutation={UPDATE_ITEM_MUTATION}>
              {(updateItem, { loading, error }) => (
                <Form
                  onSubmit={e => {
                    this.updateItem(e, updateItem);
                  }}
                >
                  <Error error={error} />
                  <fieldset disabled={loading} aria-busy={loading}>
                    <label htmlFor="file">
                      Image
                      <input
                        type="file"
                        id="file"
                        name="file"
                        placeholder="Upload an image"
                        onChange={this.uploadFile}
                      />
                      {this.state.image ? (
                        <img
                          width="200"
                          src={this.state.image}
                          alt="image preview"
                        />
                      ) : (
                        <img
                          width="200"
                          src={data.item.image}
                          alt="image preview"
                        />
                      )}
                    </label>

                    <label htmlFor="title">
                      Title
                      <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="title"
                        required
                        defaultValue={data.item.title}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="price">
                      Price
                      <input
                        type="number"
                        id="price"
                        name="price"
                        placeholder="price"
                        required
                        defaultValue={data.item.price}
                        onChange={this.handleChange}
                      />
                    </label>

                    <label htmlFor="description">
                      Description
                      <textarea
                        id="description"
                        name="description"
                        placeholder="description"
                        required
                        defaultValue={data.item.description}
                        onChange={this.handleChange}
                      />
                    </label>
                    <button type="submit" onClick={this.handleClick}>
                      Sav{loading ? "ing" : "e"} Changes
                    </button>
                  </fieldset>
                </Form>
              )}
            </Mutation>
          );
        }}
      </Query>
    );
  }
}

export default UpdateItem;
export { UPDATE_ITEM_MUTATION, SINGLE_ITEM_QUERY };
