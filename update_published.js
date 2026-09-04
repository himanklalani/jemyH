const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/jemy-optical').then(async () => {
  const result = await mongoose.connection.collection('products').updateMany(
    { isPublished: { $exists: false } },
    { $set: { isPublished: true } }
  );
  console.log('Updated ' + result.modifiedCount + ' products.');
  process.exit(0);
});
