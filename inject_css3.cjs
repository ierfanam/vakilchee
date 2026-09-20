const fs = require('fs');

const cssToInject = `
    /* 10. Floating Main Actions (Glassmorphism) */
    .end-consultation-btn, .pip-btn-icon, .doc-snap-btn, .dossier-btn-secondary, .upload-btn-primary {
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.5)) !important;
      backdrop-filter: blur(20px) saturate(180%) !important;
      -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-left: 1px solid rgba(255, 255, 255, 0.2) !important;
      box-shadow: 
        0 15px 35px rgba(0, 0, 0, 0.5),
        inset 0 1px 2px rgba(255, 255, 255, 0.2) !important;
      color: #f8fafc !important;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    }

    .end-consultation-btn {
       background: linear-gradient(145deg, rgba(220, 38, 38, 0.7), rgba(153, 27, 27, 0.8)) !important;
       border-color: rgba(248, 113, 113, 0.5) !important;
       box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4), inset 1px 1px 3px rgba(255, 255, 255, 0.4) !important;
    }
    
    .end-consultation-btn:hover {
       background: linear-gradient(145deg, rgba(239, 68, 68, 0.8), rgba(185, 28, 28, 0.9)) !important;
       box-shadow: 0 15px 40px rgba(220, 38, 38, 0.6), inset 1px 1px 3px rgba(255, 255, 255, 0.5) !important;
       transform: translateY(-2px) scale(1.02) !important;
    }

    .end-consultation-btn.restart-btn {
       background: linear-gradient(145deg, rgba(16, 185, 129, 0.7), rgba(4, 120, 87, 0.8)) !important;
       border-color: rgba(52, 211, 153, 0.5) !important;
       box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4), inset 1px 1px 3px rgba(255, 255, 255, 0.4) !important;
    }
    
    .end-consultation-btn.restart-btn:hover {
       background: linear-gradient(145deg, rgba(52, 211, 153, 0.8), rgba(5, 150, 105, 0.9)) !important;
       box-shadow: 0 15px 40px rgba(16, 185, 129, 0.6), inset 1px 1px 3px rgba(255, 255, 255, 0.5) !important;
    }

    .pip-btn-icon:hover, .doc-snap-btn:hover, .dossier-btn-secondary:hover {
      background: linear-gradient(145deg, rgba(51, 65, 85, 0.6), rgba(30, 41, 59, 0.7)) !important;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.6),
        inset 0 1px 3px rgba(255, 255, 255, 0.3) !important;
      transform: translateY(-3px) scale(1.05) !important;
      border-color: rgba(255, 255, 255, 0.4) !important;
    }
    
    .pip-btn-icon:active, .doc-snap-btn:active, .end-consultation-btn:active {
      transform: translateY(2px) scale(0.95) !important;
      box-shadow: inset 2px 4px 10px rgba(0, 0, 0, 0.6) !important;
    }

    /* Update Modal body backgrounds to match Glass theme */
    .tone-options-list, .form-studio-templates-grid, .upload-zones {
      background: rgba(0,0,0,0.1) !important;
      border-radius: 16px !important;
      padding: 12px !important;
      border: inset 1px rgba(0,0,0,0.5) !important;
    }

    /* Sub-panels */
    .tone-option-card, .form-template-card {
      background: linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)) !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 1px 1px 2px rgba(255,255,255,0.05) !important;
    }
    
    .tone-option-card:hover, .form-template-card:hover {
      background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04)) !important;
      border-color: rgba(255,255,255,0.2) !important;
    }

    .tone-option-card.active {
      background: linear-gradient(145deg, rgba(212, 175, 55, 0.25), rgba(184, 134, 11, 0.15)) !important;
      border-color: rgba(212, 175, 55, 0.6) !important;
      box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3), inset 1px 1px 4px rgba(255, 255, 255, 0.4) !important;
    }
`;

const content = fs.readFileSync('index.tsx', 'utf8');
const newContent = content.replace(/    \}\n  `;/g, `    }\n${cssToInject}\n  \`;`);

fs.writeFileSync('index.tsx', newContent);
console.log('CSS injected successfully!');
