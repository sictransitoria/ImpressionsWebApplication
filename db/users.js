var records = [
    { lastname: '', 
      firstname: '',
      username: '',    
      password: '',  
      cell: '',
      email: [ { value: 'tom@example.com' } ] }
];

exports.findById = function(id, cb) {
  process.nextTick(function() {
    var index = id - 1;
    if (records[index]) {
      cb(null, records[index]);
    } else {
      cb(new Error('User ' + id + ' does not exist'));
    }
  });
}

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}