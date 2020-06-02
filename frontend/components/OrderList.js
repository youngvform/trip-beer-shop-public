import React, { Component } from "react";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { formatDistance } from "date-fns";
import Link from "next/link";
import styled from "styled-components";
import formatMoney from "../lib/formatMoney";
import OrderItemStyles from "./styles/OrderItemStyles";
import Error from "./ErrorMessage";

const ORDER_LIST_QUERY = gql`
  query ORDER_LIST_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      total
      createdAt
      items {
        id
        title
        price
        description
        quantity
        image
      }
    }
  }
`;

const OrderUl = styled.div`
  display: grid;
  grid-gap: 4rem;
  /* grid-template-columns: repeat(auto-fit, minmax(40%, 1fr)); */
  @media (max-width: 700px) {
    font-size: 10px;
    padding: 0 10px;
  }
`;

class OrderList extends Component {
  render() {
    return (
      <Query query={ORDER_LIST_QUERY}>
        {({ data, error, loading }) => {
          if (error) <Error error={error} />;
          if (loading) <p>Loading ...</p>;
          const { orders } = data;

          return (
            <div>
              <h2>
                You have {orders.length ? orders.length : "No"} order
                {orders.length > 1 && "s"}
              </h2>
              <OrderUl>
                {orders.map(order => (
                  <OrderItemStyles key={order.id}>
                    <Link
                      href={{
                        pathname: "/order",
                        query: { id: order.id }
                      }}
                    >
                      <a>
                        <div className="order-meta">
                          <p>
                            {order.items.reduce(
                              (tot, item) => tot + item.quantity,
                              0
                            )}{" "}
                            Items
                          </p>
                          <p>{order.items.length} Products</p>
                          <p>
                            {formatDistance(
                              new Date(order.createdAt),
                              new Date()
                            )}
                          </p>
                          <p>{formatMoney(order.total)}</p>
                        </div>
                        <div className="images">
                          {order.items.map(item => (
                            <img
                              src={item.image}
                              alt={item.title}
                              key={item.id}
                            />
                          ))}
                        </div>
                      </a>
                    </Link>
                  </OrderItemStyles>
                ))}
              </OrderUl>
            </div>
          );
        }}
      </Query>
    );
  }
}

export default OrderList;
