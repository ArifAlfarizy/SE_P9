import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE = "toko_alit";

let channel = null;

export const connectPublisher = async () => {
  const conn = await amqp.connect(RABBITMQ_URL);
  channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  console.log("[Publisher] Connected to RabbitMQ");
};

export const publish = (routingKey, payload) => {
  if (!channel) throw new Error("Publisher not connected");

  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  console.log(`[Publisher] Event published: ${routingKey}`, payload);
};
