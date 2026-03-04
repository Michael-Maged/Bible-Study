'use client'

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f6f8f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
          <div className="w-20 h-20 border-4 border-[#59f20d]/20 border-t-[#59f20d] rounded-full animate-spin"></div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            📖
          </div>
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0f172a',
          marginBottom: '8px'
        }}>Loading...</h2>
        <p style={{
          fontSize: '14px',
          color: '#64748b'
        }}>Please wait</p>
      </div>
    </div>
  )
}
