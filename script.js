const bcrypt = require('bcryptjs');
bcrypt.hash('password@1', 10).then(function(hash) {
    console.log(hash, 'hash')
});
