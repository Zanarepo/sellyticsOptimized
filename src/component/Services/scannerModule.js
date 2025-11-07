import { toast } from 'react-toastify';

// Validate scanned or manually input device ID
export const validateDeviceId = async (deviceId, products) => {
  try {
    if (!Array.isArray(products)) {
      console.error('validateDeviceId: products is not an array:', products);
      toast.error('Product data is not available');
      return { error: 'Product data is not available' };
    }

    const product = products.find((p) => 
      Array.isArray(p.deviceIds) && p.deviceIds.includes(deviceId)
    );
    if (!product) {
      toast.error(`Product ID "${deviceId}" not found`);
      return { error: `Product ID "${deviceId}" not found` };
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        selling_price: product.selling_price,
        deviceId,
        deviceSize: product.deviceSizes?.[product.deviceIds.indexOf(deviceId)] || '',
      },
    };
  } catch (err) {
    console.error('validateDeviceId error:', err.message);
    toast.error(`Validation error: ${err.message}`);
    return { error: `Validation error: ${err.message}` };
  }
};