const bcrypt = require('bcrypt');

module.exports = async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};
