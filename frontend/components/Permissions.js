import React, { Component } from "react";
import { Query, Mutation } from "react-apollo";
import gql from "graphql-tag";
import Error from "./ErrorMessage";
import Table from "./styles/Table";
import RedButton from "./styles/RedButton";
import PropTypes from "prop-types";

const possiblePermissions = [
  "ADMIN",
  "USER",
  "ITEMCREATE",
  "ITEMUPDATE",
  "ITEMDELETE",
  "PERMISSIONUPDATE"
];

const UPDATE_PERMISSIONS_MUTATION = gql`
  mutation UPDATE_PERMISSIONS_MUTATION(
    $permissions: [Permission]
    $userId: ID!
  ) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      name
      email
      permissions
    }
  }
`;
const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      id
      name
      email
      permissions
    }
  }
`;

const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, error, loading }) => {
      if (loading) return <p>Loading ...</p>;
      return (
        <div>
          <Error error={error} />
          <div>
            <h2>Manage Permissions</h2>
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {possiblePermissions.map(permission => (
                    <th key={permission}>{permission}</th>
                  ))}
                  <th>▿</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(user => (
                  <UserPermissions key={user.id} user={user} />
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      );
    }}
  </Query>
);

class UserPermissions extends Component {
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array
    }).isRequired
  };

  state = {
    permissions: this.props.user.permissions
  };

  handleChange = e => {
    if (e.target.checked) {
      const newPermissions = [...this.state.permissions, e.target.value];
      this.setState({
        permissions: newPermissions
      });
    } else {
      const updatedPermissions = this.state.permissions.filter(
        permission => permission !== e.target.value
      );
      this.setState({
        permissions: updatedPermissions
      });
    }
  };
  render() {
    const { user } = this.props;

    return (
      <Mutation
        mutation={UPDATE_PERMISSIONS_MUTATION}
        variables={{ permissions: this.state.permissions, userId: user.id }}
      >
        {(updatePermission, { loading, error }) => (
          <>
            {error && (
              <tr>
                <td colSpan="8">
                  <Error error={error} />
                </td>
              </tr>
            )}
            <tr>
              <td>{user.name}</td>
              <td>{user.email}</td>
              {possiblePermissions.map(permission => (
                <td key={permission}>
                  <label htmlFor={`${user.id}-permission-${permission}`}>
                    <input
                      id={`${user.id}-permission-${permission}`}
                      type="checkbox"
                      checked={this.state.permissions.includes(permission)}
                      value={permission}
                      onChange={this.handleChange}
                    />
                  </label>
                </td>
              ))}
              <td>
                <RedButton
                  type="button"
                  disabled={loading}
                  onClick={updatePermission}
                >
                  Updat{loading ? "ing" : "e"}
                </RedButton>
              </td>
            </tr>
          </>
        )}
      </Mutation>
    );
  }
}

export default Permissions;
