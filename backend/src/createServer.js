const { GraphQLServer } = require("graphql-yoga");

const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const db = require("./db");

//create new graphql server
function createServer() {
  return new GraphQLServer({
    // typeDefs: "src/schema.graphql",
    typeDefs: __dirname + "/schema.graphql",
    resolvers: {
      Mutation,
      Query
    },
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    context: req => ({ db, ...req })
  });
}

module.exports = createServer;
