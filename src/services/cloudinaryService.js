const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (file, folder = 'profiles') => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: `smart-clinic/${folder}`,
            use_filename: true,
            unique_filename: true
        });

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

const deleteImage = async (publicId) => {
    try {
        if (!publicId) return { success: true };
        
        await cloudinary.uploader.destroy(publicId);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    uploadImage,
    deleteImage
};