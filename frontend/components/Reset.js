import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import Router from "next/router";
import PropTypes from "prop-types";
import Form from "./styles/Form";
import Error from "./ErrorMessage";
import { CURRENT_USER_QUERY } from "./User";

const REST_MUTATION = gql`
  mutation REST_MUTATION(
    $resetToken: String!
    $password: String!
    $confirmPassword: String!
  ) {
    resetPassword(
      resetToken: $resetToken
      password: $password
      confirmPassword: $confirmPassword
    ) {
      id
      name
      email
    }
  }
`;

class Reset extends Component {
  static propTypes = {
    resetToken: PropTypes.string.isRequired
  };

  state = {
    password: "",
    confirmPassword: ""
  };

  saveToChange = e => {
    const { value, name } = e.target;

    this.setState({
      [name]: value
    });
  };

  render() {
    return (
      <Mutation
        mutation={REST_MUTATION}
        variables={{ ...this.state, resetToken: this.props.resetToken }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      >
        {(reset, { error, loading, called }) => {
          return (
            <Form
              method="post"
              onSubmit={async e => {
                e.preventDefault();
                await reset();
                Router.push({
                  pathname: "/"
                });
              }}
            >
              <fieldset disabled={loading} aria-busy={loading}>
                <h2>Reset your password</h2>
                <Error error={error} />
                <label htmlFor="password">
                  Password
                  <input
                    type="password"
                    name="password"
                    placeholder="password"
                    value={this.state.password}
                    onChange={this.saveToChange}
                  />
                </label>
                <label htmlFor="confirmPassword">
                  Confirm Password
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="confirmPassword"
                    value={this.state.confirmPassword}
                    onChange={this.saveToChange}
                  />
                </label>
                <button type="submit">Reset Password!</button>
              </fieldset>
            </Form>
          );
        }}
      </Mutation>
    );
  }
}

export default Reset;
