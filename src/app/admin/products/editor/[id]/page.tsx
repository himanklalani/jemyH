import ProductEditorClient from '../new/ProductEditorClient';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ProductEditorClient productId={resolvedParams.id} />;
}
