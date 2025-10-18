// src/config/siteImages.ts
import type { ImageSizeLabel } from '@/types/images';

export const siteImages = {  
    /** General lightweight image used as background*/
    image: "featured/easy-apostille-service.png",
    imageAlt: "Image with VerifiedApostille logo, notary, verified and trusted stamp, with some documents graphics",
    imageTitle: "Easy Apostille - Best Apostille Services in India",

    /** featured image for the website */
    featuredImage: "featured/features-of-easy-apostille-services-india-mea-approved-certificate-attestation.png",
    featuredImageAlt: "Easy Apostille services in India - MEA-approved agencies offering fast and secure apostille for original, physical and scanned certificates. Nationwide courier, discounts for multiple documents, and safe handling included.",
    featuredImageTitle: "Easy Apostille - MEA Approved Certificate Attestation & Apostille Services in India",

    /** image optimization settings for srcset and responsive image sizes */
    imageVariants: [
        380, // standard width for mobile devices
        640,  // standard width for tablets, content width
        1280, // standard width to support image seo according to google's image seo guidelines
    ],
    variants: {
        avatar: 60, // author image size
        thumbnail: 120, // thumbnail size
        featured: 960, // featured image size
        mobile: 380, // standard width for mobile devices
        tablet: 640,
        desktop: 640,  // standard width for tablets, content width
        full: 1280, // standard width to support image seo according to google's image seo guidelines
    } satisfies Partial<Record<ImageSizeLabel, number>>,
  
    
    breakpoints: {
        mobileMax: 460,   // `(max-width: 460px)`
        tabletMax: 1079,  // `(max-width: 1079px)`
        desktopMin: 1080,   // `(min-width: 1080px)`
        fullMin: 1440,     // `(min-width: 1440px)`
    },

    /** supported image formats for public output */
    imageFormats: [ // upload png images, and this script will generate resized variants in these formats
        'avif', // supports modern browsers - most efficient
        'webp', // supports modern browsers - widely used
        // 'jpeg' //  only select if you need jpeg fallback
        // jpg  // 
    ],   
    compressionLevel: 80, // default quality if not overridden

    outputImageBase: './public/images', // fixed output folder

    inputImageFolder: './src/assets/images', // user-editable image folder
    featuredImageFolder: './src/assets/images/featured', // featured images only
    /* featuredImageSize: 960, // larger size for SEO & cards

    /** author or team member image for profiles like author or review users */
    avatarFolder: './src/assets/images/avatar',
    profileFolder: './src/assets/images/profile',
    /*
    authorAvatarSizes: [120, 240, 360], // widths for 1×1 square avatars
    authorBioSizes: [320, 640, 960],    // widths for 4×3 bios / profile photos
    authorAllowUpscale: true,
    authorAspects: ['1x1', '4x3'] as const, // always generate both
    */
    // ✅ Breakpoint config for responsive images
   
    // General thumbnail settings
    thumbnail: true,
    /* thumbnailSize: 120,*/

    desktopLogo: "src/assets/logos/verifiedapostille-logo-w700.png",
    desktopLogoSvg: "src/assets/logos/DesktopLogo.svg",

    mobileLogo: "src/assets/logos/verifiedapostille-mobile-logo-w1024.png",
    mobileLogoSvg: "src/assets/logos/MobileLogo.svg",

    siteIcon: "src/assets/logos/verifiedapostille-favicon-w1024.png",
    siteIconSvg: "src/assets/logos/Icon.svg",

    favIcon: "src/assets/logos/verifiedapostille-favicon-w1024.png",
    favIconSvg: "src/assets/logos/Icon.svg",

}