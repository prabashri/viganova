export const siteImages = {  

    image: "featured/astroweb-modern-website-theme-astro.png",
    imageAlt: "design to represent the nviewsweb astro theme using text and images",
    imageTitle: "nViewsWEB Astro Theme",
    imageVariants: [
        380, // standard width for mobile devices
        640,  // standard width for tablets, content width
        1280, // standard width to support image seo according to google's image seo guidelines
    ],
    variants: {
        thumbnail: 120, // thumbnail size
        featured: 960, // featured image size
        mobile: 380, // standard width for mobile devices
        tablet: 640,
        desktop: 640,  // standard width for tablets, content width
        full: 1280, // standard width to support image seo according to google's image seo guidelines
    },
     breakpoints: {
        mobileMax: 460,   // `(max-width: 460px)`
        tabletMax: 1079,  // `(max-width: 1079px)`
        desktopMin: 1080,   // `(min-width: 1080px)`
        fullMin: 1440,     // `(min-width: 1440px)`
    },
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
    featuredImageSize: 960, // larger size for SEO & cards

    // ✅ Breakpoint config for responsive images
   
    // General thumbnail settings
    thumbnail: true,
    thumbnailSize: 120,

    desktopLogo: "src/assets/logos/AstroWEB-logo.png",
    desktopLogoSvg: "src/assets/logos/DesktopLogo.svg",

    mobileLogo: "src/assets/logos/AstroWEB-icon-white-background.png",
    mobileLogoSvg: "src/assets/logos/MobileLogo.svg",

    siteIcon: "src/assets/logos/AstroWEB-icon.png",
    siteIconSvg: "src/assets/logos/Icon.svg",

    favIcon: "src/assets/logos/AstroWEB-icon.png",
    favIconSvg: "src/assets/logos/AstroWEB-icon.svg",
}