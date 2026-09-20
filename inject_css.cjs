const fs = require('fs');

const cssToInject = `
    /* =========================================
       PREMIUM 3D GLASSMORPHIC & NEUMORPHIC OVERRIDES
       ========================================= */
       
    /* 1. Global Font and Typography Harmonization */
    *, button, input, div, span, .menu-linear-item, .menu-item-text-label, .modal-header-title {
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif !important;
      letter-spacing: -0.01em;
    }

    /* 2. Glassmorphic Dropdown Panel */
    .top-menu-dropdown {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.7)) !important;
      backdrop-filter: blur(24px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
      border-radius: 24px !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
      box-shadow: 
        0 40px 80px rgba(0, 0, 0, 0.6),
        0 10px 20px rgba(0, 0, 0, 0.4),
        inset 0 1px 1px rgba(255, 255, 255, 0.2),
        inset 0 -1px 2px rgba(0, 0, 0, 0.4) !important;
      padding: 16px !important;
      gap: 10px !important;
    }

    /* 3. 3D Embossed Menu Items */
    .menu-linear-item {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 16px !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
      padding: 14px 18px !important;
      box-shadow: 
        4px 6px 12px rgba(0, 0, 0, 0.2),
        inset 1px 1px 2px rgba(255, 255, 255, 0.1) !important;
      color: #f1f5f9 !important;
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    }

    .menu-linear-item .menu-item-text-label {
      color: #e2e8f0 !important;
      font-weight: 500 !important;
      font-size: 13.5px !important;
      transition: color 0.2s ease !important;
    }

    .menu-linear-item:hover {
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05)) !important;
      transform: translateY(-2px) scale(1.01) !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
      box-shadow: 
        8px 12px 24px rgba(0, 0, 0, 0.3),
        inset 1px 1px 3px rgba(255, 255, 255, 0.2),
        0 0 15px rgba(56, 189, 248, 0.2) !important;
    }

    .menu-linear-item:active {
      transform: translateY(1px) scale(0.98) !important;
      background: rgba(0, 0, 0, 0.2) !important;
      box-shadow: 
        inset 2px 4px 10px rgba(0, 0, 0, 0.4),
        inset -1px -1px 2px rgba(255, 255, 255, 0.05) !important;
      border-top-color: rgba(0, 0, 0, 0.2) !important;
    }

    .menu-linear-item:hover .menu-item-text-label {
      color: #38bdf8 !important;
      text-shadow: 0 0 12px rgba(56, 189, 248, 0.6) !important;
    }

    /* Active Camera / Specific States */
    .menu-linear-item.active-camera {
      background: linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(4, 120, 87, 0.1)) !important;
      border-color: rgba(16, 185, 129, 0.4) !important;
      box-shadow: 
        0 8px 20px rgba(16, 185, 129, 0.25),
        inset 1px 1px 4px rgba(16, 185, 129, 0.4) !important;
    }
    
    .menu-linear-item.active-camera:hover {
      background: linear-gradient(145deg, rgba(16, 185, 129, 0.3), rgba(4, 120, 87, 0.15)) !important;
      box-shadow: 
        0 12px 28px rgba(16, 185, 129, 0.4),
        inset 1px 1px 6px rgba(255, 255, 255, 0.4) !important;
    }

    /* 4. Trigger Button - 3D Glass Sphere */
    .top-menu-trigger-btn {
      background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02)) !important;
      backdrop-filter: blur(12px) saturate(150%) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.4) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.3) !important;
      box-shadow: 
        6px 10px 20px rgba(0, 0, 0, 0.4),
        inset 2px 2px 4px rgba(255, 255, 255, 0.3),
        inset -2px -2px 6px rgba(0, 0, 0, 0.3) !important;
      color: #f8fafc !important;
    }

    .top-menu-trigger-btn:hover {
      background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05)) !important;
      box-shadow: 
        8px 15px 25px rgba(0, 0, 0, 0.5),
        0 0 20px rgba(56, 189, 248, 0.3),
        inset 2px 2px 6px rgba(255, 255, 255, 0.5) !important;
      color: #38bdf8 !important;
      transform: translateY(-2px) scale(1.05) !important;
    }

    /* 5. Realistic Light Toggle Switches */
    .toggle-switch-btn {
      background: rgba(0, 0, 0, 0.5) !important;
      box-shadow: 
        inset 0 3px 6px rgba(0,0,0,0.8),
        inset 0 1px 2px rgba(0,0,0,0.5),
        0 1px 1px rgba(255, 255, 255, 0.1) !important;
      border: 1px solid rgba(0, 0, 0, 0.8) !important;
      border-top: 1px solid rgba(0, 0, 0, 0.9) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      width: 50px !important;
      height: 26px !important;
      border-radius: 13px !important;
    }

    .toggle-switch-btn.active {
      background: linear-gradient(180deg, #065f46, #10b981) !important;
      box-shadow: 
        inset 0 2px 5px rgba(0,0,0,0.5),
        0 0 12px rgba(16, 185, 129, 0.6),
        0 1px 1px rgba(255, 255, 255, 0.2) !important;
      border-color: #047857 !important;
    }

    .toggle-switch-knob {
      background: linear-gradient(135deg, #ffffff, #e2e8f0) !important;
      box-shadow: 
        -2px 2px 5px rgba(0,0,0,0.4),
        0 2px 4px rgba(0,0,0,0.3),
        inset 0 2px 3px #ffffff,
        inset 0 -2px 3px rgba(0,0,0,0.1) !important;
      border-radius: 50% !important;
      width: 22px !important;
      height: 22px !important;
      top: 1px !important;
      left: 1px !important;
      position: relative !important;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }

    .toggle-switch-btn.active .toggle-switch-knob {
      transform: translateX(-24px) !important;
      background: linear-gradient(135deg, #ffffff, #f8fafc) !important;
      box-shadow: 
        2px 2px 5px rgba(0,0,0,0.3),
        0 2px 4px rgba(0,0,0,0.2),
        inset 0 2px 3px #ffffff,
        inset 0 -2px 3px rgba(16, 185, 129, 0.2),
        0 0 8px rgba(255, 255, 255, 0.8) !important;
    }

    /* 6. Modal Cards - Glass Panels */
    .proxy-modal-card, .upload-modal-card, .tone-modal-card, .form-studio-modal-card {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(2, 6, 23, 0.9)) !important;
      backdrop-filter: blur(28px) saturate(200%) !important;
      -webkit-backdrop-filter: blur(28px) saturate(200%) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
      box-shadow: 
        0 50px 100px rgba(0, 0, 0, 0.8),
        0 20px 40px rgba(0, 0, 0, 0.6),
        inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
      border-radius: 28px !important;
    }

    .modal-header-title {
      font-weight: 700 !important;
      color: #f8fafc !important;
      text-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
    }

    /* 7. General Buttons */
    .upload-action-btn, .control-btn, .modal-close-btn, .form-download-btn {
      background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)) !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
      border-top: 1px solid rgba(255,255,255,0.25) !important;
      box-shadow: 
        0 4px 12px rgba(0,0,0,0.2),
        inset 1px 1px 2px rgba(255,255,255,0.2) !important;
      color: #f8fafc !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 12px !important;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    }

    .upload-action-btn:hover, .control-btn:hover, .modal-close-btn:hover, .form-download-btn:hover {
      background: linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05)) !important;
      box-shadow: 
        0 8px 16px rgba(0,0,0,0.3),
        inset 1px 1px 3px rgba(255,255,255,0.4) !important;
      transform: translateY(-1px) !important;
    }

    .upload-action-btn:active, .control-btn:active, .modal-close-btn:active, .form-download-btn:active {
      background: rgba(0,0,0,0.3) !important;
      box-shadow: inset 2px 2px 6px rgba(0,0,0,0.5) !important;
      transform: translateY(1px) !important;
      border-color: rgba(0,0,0,0.3) !important;
    }

    /* 8. Text readabilities */
    .proxy-toggle-title span, .proxy-metric-label {
      color: #e2e8f0 !important;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
    }

    .proxy-toggle-desc {
      color: #cbd5e1 !important;
    }
`;

const content = fs.readFileSync('index.tsx', 'utf8');
// Find the end of the css\` block
const newContent = content.replace(/    \}\n  `;/g, `    }\n${cssToInject}\n  \`;`);

fs.writeFileSync('index.tsx', newContent);
console.log('CSS injected successfully!');
