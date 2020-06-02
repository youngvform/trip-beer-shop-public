import React from "react";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import Link from "next/link";
import { CURRENT_USER_QUERY } from "./User";

const SIGNOUT_MUTATION = gql`
  mutation SIGNOUT_MUTATION {
    signout {
      message
    }
  }
`;

const Signout = props => (
  <Mutation
    mutation={SIGNOUT_MUTATION}
    refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  >
    {(signout, { loading, error }) => (
      <button onClick={signout}>{props.children}</button>
    )}
  </Mutation>
);

export default Signout;
