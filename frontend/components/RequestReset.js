import React, { Component } from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import Form from "./styles/Form";
import Error from "./ErrorMessage";

const REQUEST_REST_MUTATION = gql`
  mutation REQUEST_REST_MUTATION($email: String!) {
    requestReset(email: $email) {
      message
    }
  }
`;

class RequestReset extends Component {
  state = {
    email: ""
  };

  saveToChange = e => {
    const { value, name } = e.target;

    this.setState({
      [name]: value
    });
  };

  render() {
    return (
      <Mutation mutation={REQUEST_REST_MUTATION} variables={this.state}>
        {(requestReset, { error, loading, called }) => {
          return (
            <Form
              method="post"
              onSubmit={async e => {
                e.preventDefault();
                await requestReset();

                this.setState({
                  email: ""
                });
              }}
            >
              <fieldset disabled={loading} aria-busy={loading}>
                <h2>Request a password reset</h2>
                <Error error={error} />
                {!error && !loading && called && (
                  <p>Success! Check your email for a reset link</p>
                )}
                <label htmlFor="email">
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="email"
                    value={this.state.email}
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

export default RequestReset;
