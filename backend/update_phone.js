const { User } = require('./models');

async function run() {
  try {
    // Update admin
    await User.update({ no_hp: '082129438009' }, { where: { role: 'admin' } });
    
    // Update user (find first user that is not admin)
    await User.update({ no_hp: '081398354797' }, { where: { role: 'user' } });
    
    console.log('Update success');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

run();
