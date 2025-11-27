// src/components/products/utils/toastError.js
import { toast } from 'react-toastify';

export const toastError = (msg) => toast.error(msg || 'Something went wrong');
export const toastSuccess = (msg) => toast.success(msg);