import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { updateUserProfile, getUserProfile } from '../services/userService';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const EditProfileModal = ({ user, visible, onClose, onProfileUpdate }) => {
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);

    useEffect(() => {
        if (user) {
            const loadUserData = async () => {
                try {
                    const profile = await getUserProfile(user.uid);
                    if (profile) {
                        setDisplayName(profile.displayName || '');
                        setBio(profile.bio || '');
                        setLocation(profile.location || '');
                        setWebsite(profile.website || '');
                    }
                } catch (error) {
                    console.error('Error loading profile:', error);
                }
            };
            loadUserData();
        }
    }, [user, visible]);

    const handlePhotoUpload = async (file) => {
        setPhotoFile(file);
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            let photoURL = user.photoURL;

            // Upload photo if selected
            if (photoFile) {
                const photoRef = ref(storage, `user-avatars/${user.uid}/${photoFile.name}`);
                await uploadBytes(photoRef, photoFile);
                photoURL = await getDownloadURL(photoRef);
            }

            // Update profile
            await updateUserProfile(user.uid, {
                displayName,
                bio,
                location,
                website,
                photoURL
            });

            alert('Profile updated successfully!');
            if (onProfileUpdate) {
                onProfileUpdate();
            }
            onClose();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Edit Profile"
            visible={visible}
            onOk={handleSave}
            onCancel={onClose}
            confirmLoading={loading}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label>Display Name:</label>
                    <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                    />
                </div>
                <div>
                    <label>Bio:</label>
                    <Input.TextArea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself"
                        maxLength={150}
                    />
                    <small>{bio.length}/150</small>
                </div>
                <div>
                    <label>Location:</label>
                    <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Your location"
                    />
                </div>
                <div>
                    <label>Website:</label>
                    <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://your-website.com"
                    />
                </div>
                <div>
                    <label>Profile Photo:</label>
                    <Upload
                        maxCount={1}
                        onChange={(info) => {
                            if (info.fileList.length > 0) {
                                handlePhotoUpload(info.fileList[0].originFileObj);
                            }
                        }}
                    >
                        <Button icon={<PlusOutlined />}>Upload Photo</Button>
                    </Upload>
                </div>
            </div>
        </Modal>
    );
};

export default EditProfileModal;
