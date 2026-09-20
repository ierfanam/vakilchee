const fs = require('fs');

const cssToInject = `
    /* 9. Main Page Badges and Banners (Glassmorphism) */
    .session-status-banner, .lawyer-badge, .memory-status-chip, .toast-view-btn, .form-notification-toast {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.6)) !important;
      backdrop-filter: blur(24px) saturate(200%) !important;
      -webkit-backdrop-filter: blur(24px) saturate(200%) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
      box-shadow: 
        0 10px 30px rgba(0, 0, 0, 0.5),
        inset 0 1px 2px rgba(255, 255, 255, 0.2) !important;
      color: #f8fafc !important;
      border-radius: 100px !important; /* Pill shape */
      font-weight: 500 !important;
      letter-spacing: 0.5px !important;
    }
    
    .session-status-banner {
       border-radius: 14px !important; /* Keep banner a rounded rectangle */
    }

    .toast-view-btn {
      background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)) !important;
      color: #38bdf8 !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
    }

    .middle-third-transcript {
      text-shadow: 0 2px 10px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.2) !important;
      color: #f8fafc !important;
      font-weight: 600 !important;
      font-size: 1.1rem !important;
    }

    .transcript-part.user {
      color: #38bdf8 !important;
      text-shadow: 0 2px 15px rgba(56, 189, 248, 0.5) !important;
    }

    .transcript-part.agent {
      color: #10b981 !important;
      text-shadow: 0 2px 15px rgba(16, 185, 129, 0.5) !important;
    }

    .menu-item-mini-badge {
      background: rgba(0,0,0,0.4) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: inset 1px 1px 3px rgba(0,0,0,0.6) !important;
      color: #e2e8f0 !important;
      border-radius: 8px !important;
      font-weight: 600 !important;
    }
    
    .menu-item-mini-badge.highlight {
      background: rgba(56, 189, 248, 0.15) !important;
      border-color: rgba(56, 189, 248, 0.3) !important;
      color: #38bdf8 !important;
    }
    
    .menu-item-mini-badge.highlight-green {
      background: rgba(16, 185, 129, 0.15) !important;
      border-color: rgba(16, 185, 129, 0.3) !important;
      color: #10b981 !important;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.2), inset 1px 1px 3px rgba(0,0,0,0.4) !important;
    }
`;

const content = fs.readFileSync('index.tsx', 'utf8');
const newContent = content.replace(/    \}\n  `;/g, `    }\n${cssToInject}\n  \`;`);

fs.writeFileSync('index.tsx', newContent);
console.log('CSS injected successfully!');
