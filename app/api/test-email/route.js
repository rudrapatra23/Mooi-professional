// Simple test endpoint for email
import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({ error: 'Please login first' }, { status: 401 });
        }

        // Check environment variables
        const envCheck = {
            SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
            FROM_EMAIL: process.env.FROM_EMAIL || 'info@mooiprofessional.com (default)',
            OWNER_EMAIL: process.env.OWNER_EMAIL || 'info@mooiprofessional.com (default)',
        };

        console.log('[email-test] Environment check:', envCheck);
        console.log('[email-test] FROM_EMAIL value:', process.env.FROM_EMAIL);

        if (!process.env.SENDGRID_API_KEY) {
            return NextResponse.json({
                success: false,
                error: 'SENDGRID_API_KEY not configured',
                envCheck,
            });
        }

        // Get test email from query params
        const url = new URL(req.url);
        const testEmail = url.searchParams.get('email');

        if (!testEmail) {
            return NextResponse.json({
                success: false,
                error: 'No email provided',
                usage: '/api/test-email?email=your@email.com',
                envCheck,
            });
        }

        console.log('[email-test] Sending test email to:', testEmail);

        // Send simple test email
        const result = await sendTestEmail(testEmail);

        return NextResponse.json({
            success: result.success,
            message: result.success ? 'Email sent! Check your inbox.' : 'Failed to send email',
            result,
            envCheck,
        });

    } catch (error) {
        console.error('[email-test] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
