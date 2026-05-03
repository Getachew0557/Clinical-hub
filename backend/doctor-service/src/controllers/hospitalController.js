import Hospital from '../models/Hospital.js';

export const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await Hospital.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
        res.status(200).json(hospitals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getHospitalById = async (req, res) => {
    try {
        const hospital = await Hospital.findByPk(req.params.id);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
        res.status(200).json(hospital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createHospital = async (req, res) => {
    try {
        const { name, address, phone, email, description } = req.body;
        const logo = req.file ? `uploads/${req.file.filename}` : null;
        
        const hospital = await Hospital.create({ name, address, phone, email, description, logo });
        res.status(201).json(hospital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateHospital = async (req, res) => {
    try {
        const { name, address, phone, email, description, isActive } = req.body;
        const hospital = await Hospital.findByPk(req.params.id);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        if (req.file) {
            hospital.logo = `uploads/${req.file.filename}`;
        }

        await hospital.update({ name, address, phone, email, description, isActive });
        res.status(200).json(hospital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findByPk(req.params.id);
        if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

        // Soft delete
        hospital.isActive = false;
        await hospital.save();
        res.status(200).json({ message: 'Hospital deactivated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
