/*
  * This module sets up a connection to a Redis db for storing OTPs and their associated phone numbers temporarily
*/
const Redis = require("ioredis");

const redis = new Redis({
	host: process.env.REDIS_HOST,
	port: process.env.REDIS_PORT,
});

module.exports = redis;
