import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DoctorProfile = sequelize.define('DoctorProfile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Links to the User record in auth-service (stored as UUID, no cross-DB FK)
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        comment: 'UUID of the corresponding User in auth-service (role: Doctor)'
    },
    fullName: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    specialization: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'E.g. General Dentistry, Orthodontics, Oral Surgery'
    },
    licenseNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Years of professional experience'
    },
    qualification: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: 'E.g. BDS, MDS, DDS'
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Short professional biography'
    },
    workingDays: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of working days, e.g. ["Monday","Wednesday","Friday"]'
    },
    workingHoursStart: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Shift start time, e.g. 08:00:00'
    },
    workingHoursEnd: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Shift end time, e.g. 17:00:00'
    },
    consultationFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Clinic visit consultation fee'
    },
    videoFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Video consultation fee (overrides consultationFee for video bookings)'
    },
    serviceTypes: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: ['clinic', 'video'],
        comment: 'Services offered: ["clinic"], ["video"], or ["clinic","video"]'
    },
    slotDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        comment: 'Appointment slot duration in minutes (default 30)'
    },
    breakStart: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Break/lunch start time, e.g. 13:00:00'
    },
    breakEnd: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Break/lunch end time, e.g. 14:00:00'
    },
    languages: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: ['Amharic', 'English'],
        comment: 'Languages spoken by the doctor'
    },
    education: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of { institution, degree, year } objects'
    },
    workExperience: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of { place, role, period } objects'
    },
    awards: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of { title, year } objects'
    },
    maxPatientsPerHour: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: 'Maximum patients per hour (default 10 → 5 per 30-min slot)'
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 5.0,
        comment: 'Doctor rating out of 5'
    },
    reviewsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Total number of reviews'
    },
    profilePhoto: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Relative file path to uploaded photo'
    },
    hospitals: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'List of hospitals the doctor is associated with'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

export default DoctorProfile;
