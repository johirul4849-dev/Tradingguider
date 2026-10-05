// Generates high-resolution JPG Partner Credentials & Coupon Card for Influencers
import { InfluencerRecord } from '../services/subscriptionService';

export function generateAndDownloadInfluencerJpg(influencer: InfluencerRecord): void {
  const canvas = document.createElement('canvas');
  // High resolution 1200 x 680 for crisp JPG download
  const width = 1200;
  const height = 680;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0B0E14');
  bgGrad.addColorStop(0.5, '#131A2A');
  bgGrad.addColorStop(1, '#080A0E');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative cyber grid / borders
  ctx.strokeStyle = 'rgba(41, 98, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner subtle golden border
  ctx.strokeStyle = 'rgba(255, 179, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Glowing header pill
  ctx.fillStyle = 'rgba(255, 179, 0, 0.12)';
  ctx.beginPath();
  ctx.roundRect(60, 60, 420, 44, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 179, 0, 0.6)';
  ctx.stroke();

  ctx.fillStyle = '#FFB300';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText('★ OFFICIAL INFLUENCER PARTNER CARD', 80, 88);

  // Brand Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('TRADEPILOT PRO', 60, 160);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '18px sans-serif';
  ctx.fillText('Authorized Affiliate & Creator Commission Credentials', 60, 192);

  // Partner Name & ID Box
  ctx.fillStyle = 'rgba(19, 23, 34, 0.9)';
  ctx.beginPath();
  ctx.roundRect(60, 220, 500, 370, 16);
  ctx.fill();
  ctx.strokeStyle = '#2A2E39';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText('PARTNER DETAILS', 90, 260);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`Name: ${influencer.name}`, 90, 300);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px monospace';
  ctx.fillText(`Email: ${influencer.email}`, 90, 335);

  ctx.fillStyle = '#00E676';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`Portal User ID: ${influencer.userId}`, 90, 385);

  ctx.fillStyle = '#FF9100';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`Password: ${influencer.password}`, 90, 425);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '15px monospace';
  ctx.fillText(`Binance Pay ID: ${influencer.binanceId || 'Not set (Add in portal)'}`, 90, 465);

  ctx.fillStyle = '#64748B';
  ctx.font = '13px sans-serif';
  ctx.fillText('• Login to your Influencer Portal to track commissions & withdraw (Min $20)', 90, 520);
  ctx.fillText('• Keep your password private and safe.', 90, 545);

  // Right Box: Big Coupon Code Banner
  ctx.fillStyle = 'rgba(22, 163, 74, 0.08)';
  ctx.beginPath();
  ctx.roundRect(590, 220, 550, 370, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#00E676';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText('EXCLUSIVE DISCOUNT COUPON CODE', 620, 265);

  // Giant Coupon Box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(620, 290, 490, 90, 12);
  ctx.fill();
  ctx.strokeStyle = '#00E676';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 52px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(influencer.couponCode, 620 + 245, 355);
  ctx.textAlign = 'left';

  // Commission Rates Breakdown
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('Your Commission & Customer Discount Rates:', 620, 425);

  const perks = [
    { pkg: '1 Month ($8)', disc: 'Customer Saves $1', earn: 'You Earn $1.00' },
    { pkg: '6 Months ($40)', disc: 'Customer Saves $5', earn: 'You Earn $5.00' },
    { pkg: '12 Months ($70)', disc: 'Customer Saves $8', earn: 'You Earn $10.00' },
  ];

  perks.forEach((p, idx) => {
    const py = 460 + idx * 36;
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(p.pkg, 620, py);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`➜ ${p.disc}`, 770, py);

    ctx.fillStyle = '#00E676';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`★ ${p.earn}`, 970, py);
  });

  // Footer note
  ctx.fillStyle = '#64748B';
  ctx.font = '13px monospace';
  ctx.fillText(`Issued: ${new Date(influencer.createdAt).toLocaleDateString()} • Verified Creator Program`, 60, 630);

  // Trigger JPG Download
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.download = `tradepilot_influencer_${influencer.couponCode}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
