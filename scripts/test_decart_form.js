const apiKey = 'dct_test_qvkAJzTuFewzCNYiMYGtnLpDGCMSIejqAapnfqJNjFdiJqtaaybwilhavPJZfBkd';

async function testDecart() {
  try {
    const userImgUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80';
    const garmentImgUrl = 'https://cdn.shopify.com/s/files/1/0623/7916/3734/files/F-BTDN-CTN-OOXF-BF-WHT_0038.jpg?v=1784064032&width=900';

    console.log('Fetching user image & garment image...');
    const userRes = await fetch(userImgUrl);
    const userBlob = await userRes.blob();

    const garmentRes = await fetch(garmentImgUrl);
    const garmentBlob = await garmentRes.blob();

    const form = new FormData();
    form.append('data', userBlob, 'user_photo.jpg');
    form.append('reference_image', garmentBlob, 'garment.jpg');
    form.append('prompt', 'Wearing white oxford shirt, studio fashion lighting');
    form.append('resolution', '720p');
    form.append('enhance_prompt', 'true');

    console.log('Submitting to Decart API https://api.decart.ai/v1/jobs/lucy-vton-3.6 ...');
    const response = await fetch('https://api.decart.ai/v1/jobs/lucy-vton-3.6', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: form,
    });

    console.log('HTTP Status:', response.status);
    const text = await response.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Test error:', err);
  }
}

testDecart();

