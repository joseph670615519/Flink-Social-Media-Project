import React from 'react';

function VideoCall() {
  const handleVideoCallClick = () => {
    window.open('https://tuyet-presystolic-jillian.ngrok-free.dev', '_blank');
  };

  return (
    <button 
      style={{
        background: '#4CAF50',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s',
        fontWeight: '500'
      }}
      onClick={handleVideoCallClick}
      onMouseOver={(e) => e.target.style.background = '#45a049'}
      onMouseOut={(e) => e.target.style.background = '#4CAF50'}
      title="Start Video Call"
    >
      📹 Video Call
    </button>
  );
}

export default VideoCall;