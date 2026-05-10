import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const EXCHANGE = "toko_alit";
const QUEUE = "order.notifications";
const DLQ = "order.notifications.dlq"; 
export const startConsumer = async () => {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });

 
  await channel.assertQueue(DLQ, { durable: true });

 
  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",       
      "x-dead-letter-routing-key": DLQ, 
    },
  });

  await channel.bindQueue(QUEUE, EXCHANGE, "order.created");

  channel.prefetch(1);

  console.log("[Consumer] Waiting for messages...");

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      console.log("[Consumer] Processing event: order.created", payload);

      await handleOrderCreated(payload);

      channel.ack(msg); 
    } catch (err) {
      console.error("[Consumer] Failed to process message:", err.message);

     
      channel.nack(msg, false, false);
    }
  });
};


const handleOrderCreated = async (payload) => {
  const { orderId, customerId, customerName, totalPrice } = payload;

  
  console.log(`[Notification] Order #${orderId} from ${customerName} with total Rp${totalPrice} successfully created.`);

 
};