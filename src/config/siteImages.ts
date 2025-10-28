// src/config/siteImages.ts
import type { ImageSizeLabel } from '@/types/images';

export const siteImages = {  
    /** General lightweight image used as background*/
    image: "featured/viga-nova-green-energy-solutions.png",
    imageAlt: "Image with Viga Nova Green Energy Solutions with green energy icons and sustainable future",
    imageTitle: "Viga Nova - Best Green Energy Solutions from India to transform the future",

    /** featured image for the website */
    featuredImage: "featured/viga-nova-green-energy-solutions-vision-mission.png",
    featuredImageAlt: "Viga Nova logo with vision and mission for a sustainable future with green energy solutions",
    featuredImageTitle: "Viga Nova - Vision and Mission for a Sustainable Future",

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

    desktopLogo: "src/assets/logos/viganova-logo-white-bg.png",
    desktopLogoSvg: "src/assets/logos/DesktopLogo.svg",

    mobileLogo: "src/assets/logos/viganova-mobile-logo-white-bg.png",
    mobileLogoSvg: "src/assets/logos/MobileLogo.svg",

    siteIcon: "src/assets/logos/viganova-mobile-logo-white-bg.png",
    siteIconSvg: "src/assets/logos/Icon.svg",

    favIcon: "src/assets/logos/viganova-mobile-logo-white-bg.png",
    favIconSvg: "src/assets/logos/Icon.svg",

}