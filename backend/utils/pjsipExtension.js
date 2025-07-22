/**
 * Create a PJSIP extension in Asterisk via AMI UpdateConfig
 * @param {object} ami - The AMI client instance
 * @param {string} extension - Extension number
 * @param {string} password - SIP password
 * @param {object} [options] - Optional parameters (e.g., callerid, context)
 */
async function createPjsipExtension(ami, extension, password, options = {}) {
  // Default options
  const {
    callerid = `${extension} <${extension}>`,
    context = 'default',
    transport = 'transport-udp',
    aor = extension,
    auth = extension,
    max_contacts = 1,
    type = 'endpoint',
    disallow = 'all',
    allow = 'ulaw,alaw',
    ...rest
  } = options;

  // 1. Add endpoint section
  await ami.action({
    Action: 'UpdateConfig',
    SrcFilename: 'pjsip.conf',
    DstFilename: 'pjsip.conf',
    'Action-000000': 'NewCat',
    'Cat-000000': extension,
    'Var-000001': 'type',
    'Value-000001': 'endpoint',
    'Var-000002': 'context',
    'Value-000002': context,
    'Var-000003': 'disallow',
    'Value-000003': disallow,
    'Var-000004': 'allow',
    'Value-000004': allow,
    'Var-000005': 'auth',
    'Value-000005': auth,
    'Var-000006': 'aors',
    'Value-000006': aor,
    'Var-000007': 'callerid',
    'Value-000007': callerid,
    'Var-000008': 'transport',
    'Value-000008': transport,
    'Var-000009': 'max_contacts',
    'Value-000009': max_contacts.toString(),
    ...Object.entries(rest).reduce((acc, [k, v], i) => {
      acc[`Var-${String(10 + i).padStart(6, '0')}`] = k;
      acc[`Value-${String(10 + i).padStart(6, '0')}`] = v;
      return acc;
    }, {})
  });

  // 2. Add auth section
  await ami.action({
    Action: 'UpdateConfig',
    SrcFilename: 'pjsip.conf',
    DstFilename: 'pjsip.conf',
    'Action-000000': 'NewCat',
    'Cat-000000': `${extension}auth`,
    'Var-000001': 'type',
    'Value-000001': 'auth',
    'Var-000002': 'auth_type',
    'Value-000002': 'userpass',
    'Var-000003': 'password',
    'Value-000003': password,
    'Var-000004': 'username',
    'Value-000004': extension,
  });

  // 3. Add aor section
  await ami.action({
    Action: 'UpdateConfig',
    SrcFilename: 'pjsip.conf',
    DstFilename: 'pjsip.conf',
    'Action-000000': 'NewCat',
    'Cat-000000': `${extension}aor`,
    'Var-000001': 'type',
    'Value-000001': 'aor',
    'Var-000002': 'max_contacts',
    'Value-000002': max_contacts.toString(),
  });

  // Optionally reload PJSIP
  await ami.action({ Action: 'Command', Command: 'pjsip reload' });

  return { success: true, extension };
}

module.exports = { createPjsipExtension };
