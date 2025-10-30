import { storage, db, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';

// Test Firebase connectivity
export const testFirebaseConnection = async () => {
    console.log('🔥 Testing Firebase connection...');
    
    try {
        // Test 1: Auth
        console.log('👤 Auth user:', auth.currentUser?.uid || 'Not logged in');
        
        // Test 2: Firestore
        console.log('📄 Testing Firestore...');
        const testDoc = await addDoc(collection(db, 'test'), {
            test: true,
            timestamp: new Date()
        });
        console.log('✅ Firestore test successful:', testDoc.id);
        
        // Test 3: Storage (small test file)
        console.log('💾 Testing Storage...');
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testRef = ref(storage, `test/${Date.now()}_test.txt`);
        const snapshot = await uploadBytes(testRef, testBlob);
        const url = await getDownloadURL(snapshot.ref);
        console.log('✅ Storage test successful:', url);
        
        return { success: true };
    } catch (error) {
        console.error('❌ Firebase test failed:', error);
        return { success: false, error };
    }
};

// Test image upload specifically
export const testImageUpload = async (file) => {
    console.log('📸 Testing image upload for:', file.name);
    
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        
        // Create reference
        const imagePath = `test-images/${user.uid}/${Date.now()}_${file.name}`;
        const imageRef = ref(storage, imagePath);
        
        console.log('⬆️ Uploading to:', imagePath);
        
        // Upload with timeout
        const uploadPromise = uploadBytes(imageRef, file);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 15000)
        );
        
        const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
        const url = await getDownloadURL(snapshot.ref);
        
        console.log('✅ Test image upload successful!');
        return { success: true, url };
        
    } catch (error) {
        console.error('❌ Test image upload failed:', error);
        return { success: false, error };
    }
};