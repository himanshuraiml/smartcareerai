
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

async function main() {
    logger.info('Seeding demo email templates...');

    const templates = [
        {
            name: 'Demo Product Launch',
            subject: 'Introducing {{productName}} - Our Latest Innovation!',
            category: 'PROMOTIONAL',
            variables: ['userName', 'productName', 'launchDate', 'ctaLink', 'featureList'],
            textContent: `Hi {{userName}},\n\nWe are excited to announce {{productName}}, launching on {{launchDate}}!\n\nCheck it out here: {{ctaLink}}`,
            htmlContent: `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
  .content { background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
  .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; transition: background 0.3s; }
  .button:hover { background: #4f46e5; }
  .footer { text-align: center; margin-top: 30px; font-size: 13px; color: #6b7280; }
  .feature-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1; }
  h1 { margin: 0; font-size: 28px; font-weight: 700; }
  h2 { color: #1f2937; font-size: 20px; margin-top: 0; }
  ul { text-align: left; margin: 0; padding-left: 20px; }
  li { margin-bottom: 8px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 {{productName}} is Here!</h1>
      <p style="margin-top: 10px; opacity: 0.9; font-size: 18px;">The future of technology has arrived.</p>
    </div>
    <div class="content">
      <p>Hello <strong>{{userName}}</strong>,</p>
      
      <p>We are thrilled to introduce our latest innovation, <strong>{{productName}}</strong>, officially launching on <strong>{{launchDate}}</strong>.</p>
      
      <div class="feature-box">
        <h2>✨ Key Features</h2>
        <div style="white-space: pre-line;">
          {{featureList}}
        </div>
      </div>
      
      <p>Be among the first to experience the revolution in technology. Don't miss out on our exclusive launch offer.</p>
      
      <center>
        <a href="{{ctaLink}}" class="button">Get Started Now</a>
      </center>
    </div>
    <div class="footer">
      <p>&copy; 2024 PlaceNxt. All rights reserved.</p>
      <p>123 Innovation Drive, Tech City, TC 90210</p>
      <p><a href="#" style="color: #6366f1;">Unsubscribe</a> • <a href="#" style="color: #6366f1;">View in Browser</a></p>
    </div>
  </div>
</body>
</html>`
        },
        {
            name: 'Demo Monthly Newsletter',
            subject: '{{month}} Newsletter: Top Updates for {{userName}}',
            category: 'NEWSLETTER',
            variables: ['userName', 'month', 'highlight1', 'highlight2', 'blogLink'],
            textContent: `Hi {{userName}},\n\nHere are your updates for {{month}}.\n\n1. {{highlight1}}\n2. {{highlight2}}\n\nRead more: {{blogLink}}`,
            htmlContent: `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6; }
  .wrapper { max-width: 640px; margin: 0 auto; background: white; }
  .header { padding: 30px; text-align: center; border-bottom: 3px solid #6366f1; }
  .logo { font-size: 24px; font-weight: bold; color: #111827; text-decoration: none; }
  .hero { background-color: #f9fafb; padding: 40px 30px; text-align: center; }
  .section { padding: 30px; border-bottom: 1px solid #e5e7eb; }
  .footer { background-color: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 12px; }
  .button { display: inline-block; background: #111827; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 14px; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <a href="#" class="logo">PlaceNxt</a>
    </div>
    
    <div class="hero">
      <h1 style="margin: 0 0 10px 0; color: #111827;">{{month}} Edition</h1>
      <p style="margin: 0; font-size: 18px; color: #6b7280;">Curated insights just for you, {{userName}}</p>
    </div>

    <div class="section">
      <h2 style="color: #6366f1;">🔥 This Month's Highlights</h2>
      
      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 5px;">1. {{highlight1}}</h3>
        <p>Dive deep into our latest feature release that helps you achieve more in less time.</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="margin-bottom: 5px;">2. {{highlight2}}</h3>
        <p>See how our community is growing and what new opportunities are available.</p>
      </div>
      
      <p style="margin-top: 30px;">
        <a href="{{blogLink}}" class="button">Read Full Blog Post</a>
      </p>
    </div>

    <div class="footer">
      <p>You received this email because you are subscribed to PlaceNxt updates.</p>
      <p>© 2024 PlaceNxt Inc.</p>
    </div>
  </div>
</body>
</html>`
        }
    ];

    for (const t of templates) {
        const existing = await prisma.emailTemplate.findUnique({ where: { name: t.name } });
        if (!existing) {
            await prisma.emailTemplate.create({
                data: {
                    name: t.name,
                    subject: t.subject,
                    htmlContent: t.htmlContent,
                    textContent: t.textContent,
                    category: t.category as any,
                    variables: t.variables,
                    isActive: true,
                    createdBy: 'system'
                }
            });
            logger.info(`Created template: ${t.name}`);
        } else {
            logger.info(`Template already exists: ${t.name}`);
        }
    }
}

main()
    .catch((e) => {
        // console.error(e);
        logger.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
