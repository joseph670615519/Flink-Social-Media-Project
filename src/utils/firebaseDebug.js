// Firebase Debug Helper
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const testFirebaseStorage = async () => {
  console.log('🔧 Testing Firebase Storage...');
  
  try {
    // Test storage reference
    const testRef = ref(storage, 'test/connection-test.txt');
    console.log('✅ Storage reference created:', testRef);
    
    // Test upload (small text file)
    const testData = new Blob(['Test connection'], { type: 'text/plain' });
    const snapshot = await uploadBytes(testRef, testData);
    console.log('✅ Test upload successful:', snapshot);
    
    // Test download
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Download URL generated:', downloadURL);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    return false;
  }
};

export const debugImageUpload = (file) => {
  console.log('🖼️ Image Debug Info:');
  console.log('- File name:', file.name);
  console.log('- File size:', file.size, 'bytes');
  console.log('- File type:', file.type);
  console.log('- File lastModified:', new Date(file.lastModified));
  
  // Check if it's a valid image
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const isValid = validTypes.includes(file.type);
  console.log('- Is valid type:', isValid);
  
  return isValid;
};