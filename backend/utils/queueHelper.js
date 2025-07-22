// Utility to expose queueData from AMI config
const { queueData } = require('../config/amiConfig');

function getAllQueuesFromAmi() {
  // Return all queues as an array
  const queues = Object.values(queueData);
  console.log('getAllQueuesFromAmi:', queues);
  return queues;
}

module.exports = { getAllQueuesFromAmi };
