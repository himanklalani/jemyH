import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/jemy').then(async () => {
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  await Product.updateOne({ slug: 'titanium-geo' }, { $set: { images: ['/images/titanium_lifestyle_1_1787494228901.png', '/images/titanium_macro_1787494244263.png'] } });
  
  await Product.updateOne({ slug: 'classic-tortoiseshell' }, { $set: { images: ['/images/glasses_lifestyle_1_1787493103772.png'] } });
  
  await Product.updateOne({ slug: 'onyx-cat-eye' }, { $set: { images: ['/images/sun_lifestyle_1_1787494277969.png', '/images/sun_macro_1787494291484.png'] } });

  console.log('Images updated.');
  mongoose.connection.close();
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
