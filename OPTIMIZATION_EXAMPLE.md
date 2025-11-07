# Optimization Example: Refactored Scanner Handler

## Before (Duplicated Code - ~150 lines per handler)

### External Scanner Handler (Lines 232-414)
### Webcam Scanner Handler (Lines 459-628)  
### Manual Input Handler (Lines 734-903)

**Each handler contains:**
- Device sold check (~15 lines)
- Product lookup (~15 lines)
- Product parsing (~10 lines)
- Line update logic (~100+ lines)

**Total: ~450 lines of duplicate code**

---

## After (Using Shared Utilities - ~30 lines per handler)

### Example: Refactored Manual Input Handler

```javascript
import { validateAndFetchDevice, hasDuplicateDeviceId } from '../../utils/deviceValidation';

const handleManualInput = async () => {
  const trimmedInput = manualInput.trim();
  if (!trimmedInput) {
    toast.error('Product ID cannot be empty');
    setScannerError('Product ID cannot be empty');
    return;
  }

  // Single function call replaces 80+ lines of validation
  const result = await validateAndFetchDevice(trimmedInput, storeId);
  
  if (!result.success) {
    toast.error(result.error);
    setScannerError(result.error);
    setManualInput('');
    return;
  }

  const { product, deviceIdIndex, deviceSize } = result;
  const { modal, lineIdx, deviceIdx } = scannerTarget;

  // Check for duplicates
  if (modal === 'add') {
    if (hasDuplicateDeviceId(lines, trimmedInput, lineIdx, deviceIdx)) {
      toast.error(`Product ID "${trimmedInput}" already exists`);
      setManualInput('');
      return;
    }
  } else if (modal === 'edit') {
    if (saleForm.deviceIds.some((id, i) => 
      i !== deviceIdx && id.trim().toLowerCase() === trimmedInput.toLowerCase()
    )) {
      toast.error(`Product ID "${trimmedInput}" already exists`);
      setManualInput('');
      return;
    }
  }

  // Update lines/saleForm (extract to separate function)
  updateFormWithDevice(product, trimmedInput, deviceSize, deviceIdIndex, modal, lineIdx, deviceIdx);
  
  setScannerError(null);
  setScannerLoading(false);
  setManualInput('');
  toast.success(`Added Product ID: ${trimmedInput}`);
};
```

---

## Benefits

1. **Code Reduction**: 450 lines → ~150 lines (67% reduction)
2. **Maintainability**: Fix bugs in one place, not three
3. **Testability**: Utilities can be unit tested independently
4. **Performance**: Shared functions can be memoized
5. **Consistency**: Same validation logic everywhere

---

## Next Steps

1. Extract `updateFormWithDevice` function
2. Create `useDeviceScanner` hook for scanner logic
3. Extract line update logic to `useSalesLines` hook
4. Split component into smaller pieces

