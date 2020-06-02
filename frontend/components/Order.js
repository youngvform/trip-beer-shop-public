import React, { Component } from "react";
import PropTypes from "prop-types";
import { Query } from "react-apollo";
import { format } from "date-fns";
import Head from "next/head";
import gql from "graphql-tag";
import formatMoney from "../lib/formatMoney";
import Error from "./ErrorMessage";
import OrderStyles from "./styles/OrderStyles";

const SINGLE_ORDER_QUERY = gql`
  query SINGLE_ORDER_QUERY($id: ID!) {
    order(id: $id) {
      id
      charge
      total
      createdAt
      items {
        id
        title
        description
        image
        price
        quantity
      }
      user {
        id
      }
    }
  }
`;

class Order extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired
  };
  render() {
    return (
      <Query query={SINGLE_ORDER_QUERY} variables={{ id: this.props.id }}>
        {({ data, error, loading }) => {
          if (loading) return <p>loading....</p>;
          if (error) return <Error error={error} />;
          const order = data.order;

          console.log(order);
          const date = new Date(order.createdAt);
          console.log(date);
          return (
            <OrderStyles>
              <Head>
                <title>Trip Beer - Order {order.id}</title>
              </Head>
              <p>
                <span>Order ID: </span>
                <span>{this.props.id} </span>
              </p>
              <p>
                <span>Charge </span>
                <span>{order.charge} </span>
              </p>
              <p>
                <span>Date </span>
                <span>
                  {format(date, "yyyy년 M월 d일 a h시 mm분 ", {
                    awareOfUnicodeTokens: true
                  })}
                </span>
              </p>
              <p>
                <span>Order Total </span>
                <span>{formatMoney(order.total)} </span>
              </p>
              <p>
                <span>Item Count </span>
                <span>{order.items.length} </span>
              </p>
              <div className="items">
                {order.items.map(item => (
                  <div className="order-item" key={item.id}>
                    <img src={item.image} alt={item.title} />
                    <div className="item-details">
                      <h2>{item.title}</h2>
                      <p>Qty: {item.quantity}</p>
                      <p>Each: {formatMoney(item.price)}</p>
                      <p>SubTotal: {formatMoney(item.price * item.quantity)}</p>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </OrderStyles>
          );
        }}
      </Query>
    );
  }
}

export default Order;
