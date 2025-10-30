import React from 'react';

function QRCodeGenerator({ url }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  
  return (
    <div className="qr-code-section">
      <h3>📱 Scan to access on mobile</h3>
      <div className="qr-container">
        <img src={qrCodeUrl} alt="QR Code for mobile access" />
        <p>Scan this QR code with your phone</p>
        <code>{url}</code>
      </div>
    </div>
  );
}

export default QRCodeGenerator;