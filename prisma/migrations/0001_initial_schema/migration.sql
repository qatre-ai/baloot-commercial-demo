-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "nationalId" TEXT,
    "educationLevel" TEXT,
    "fieldOfStudy" TEXT,
    "registrationInstrument" TEXT,
    "primaryInstrument" TEXT,
    "secondaryInstruments" TEXT,
    "musicExperienceYears" INTEGER,
    "previousTraining" TEXT,
    "musicGenres" TEXT,
    "learningGoals" TEXT,
    "practiceHoursPerWeek" INTEGER,
    "skillLevel" TEXT,
    "instructorName" TEXT,
    "instructorNameKnown" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "emergencyContact" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentRelation" TEXT,
    "referralSource" TEXT,
    "referralDetail" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "customerLifetimeValue" INTEGER NOT NULL DEFAULT 0,
    "churnRisk" TEXT,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "preferredBranch" TEXT,
    "specialtyFa" TEXT,
    "specialtyEn" TEXT,
    "bioFa" TEXT,
    "bioEn" TEXT,
    "experience" TEXT,
    "socialLinks" TEXT,
    "instructorOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublishedInstructor" BOOLEAN NOT NULL DEFAULT false,
    "teachingInstruments" TEXT,
    "certifications" TEXT,
    "hourlyRate" INTEGER,
    "availableDays" TEXT,
    "availableTimeRanges" TEXT,
    "instructorRating" REAL NOT NULL DEFAULT 0,
    "totalTeachingHours" INTEGER NOT NULL DEFAULT 0,
    "totalStudentsTaught" INTEGER NOT NULL DEFAULT 0,
    "hireDate" TEXT,
    "contractType" TEXT,
    "instructorStatus" TEXT NOT NULL DEFAULT 'active',
    "feedbackSummary" TEXT,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" DATETIME,
    "lastLoginIp" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "registrationStatus" TEXT NOT NULL DEFAULT 'approved',
    "aiRecommendations" TEXT,
    "aiLastAnalysis" DATETIME,
    "aiSegmentTag" TEXT,
    "aiChurnFactors" TEXT,
    "aiNextBestAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastLoginAt" DATETIME,
    "lastLoginIp" TEXT,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT,
    "studentId" TEXT,
    "userType" TEXT NOT NULL,
    "sessionToken" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceFingerprint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "LoginSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LoginSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "deviceFingerprint" TEXT,
    "ipAddress" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminDevice_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntrusionAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetAdminId" TEXT,
    "attemptType" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "deviceFingerprint" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "details" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntrusionAlert_targetAdminId_fkey" FOREIGN KEY ("targetAdminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "parentMessageId" TEXT,
    "isSystemMessage" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "archivedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdminMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "performedBy" TEXT,
    "backupType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileKey" TEXT,
    "checksum" TEXT,
    "checksumAlgorithm" TEXT DEFAULT 'sha256',
    "encryptionUsed" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BackupRecord_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "educationLevel" TEXT,
    "fieldOfStudy" TEXT,
    "registrationInstrument" TEXT,
    "primaryInstrument" TEXT,
    "secondaryInstruments" TEXT,
    "musicExperienceYears" INTEGER,
    "previousTraining" TEXT,
    "musicGenres" TEXT,
    "learningGoals" TEXT,
    "practiceHoursPerWeek" INTEGER,
    "skillLevel" TEXT,
    "instructorName" TEXT,
    "instructorNameKnown" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "emergencyContact" TEXT,
    "preferredBranch" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentRelation" TEXT,
    "referralSource" TEXT,
    "referralDetail" TEXT,
    "specialtyFa" TEXT,
    "specialtyEn" TEXT,
    "bioFa" TEXT,
    "bioEn" TEXT,
    "experience" TEXT,
    "socialLinks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "createdUserId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classCode" TEXT,
    "titleFa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionFa" TEXT,
    "descriptionEn" TEXT,
    "category" TEXT,
    "instrument" TEXT,
    "level" TEXT NOT NULL DEFAULT 'all',
    "classType" TEXT NOT NULL DEFAULT 'group',
    "duration" TEXT,
    "sessionsMin" INTEGER,
    "sessionsMax" INTEGER,
    "price" INTEGER,
    "imageUrl" TEXT,
    "coverUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isShowOnHome" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT,
    "instructorId" TEXT,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "registrationOpenAt" DATETIME,
    "registrationCloseAt" DATETIME,
    "maxCapacity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "notes" TEXT,
    "registrationMethod" TEXT NOT NULL DEFAULT 'online',
    "registeredByAdminId" TEXT,
    "tuitionAmount" INTEGER,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paidAt" DATETIME,
    "paymentDueDate" DATETIME,
    "paymentRef" TEXT,
    "lastEditedByAdminId" TEXT,
    "lastEditedAt" DATETIME,
    CONSTRAINT "CourseEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleFa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionFa" TEXT,
    "descriptionEn" TEXT,
    "instructorFa" TEXT NOT NULL,
    "instructorEn" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "price" INTEGER,
    "discountPrice" INTEGER,
    "totalSeats" INTEGER NOT NULL DEFAULT 30,
    "reservedSeats" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "coverUrl" TEXT,
    "category" TEXT,
    "locationFa" TEXT,
    "locationEn" TEXT,
    "requirementsFa" TEXT,
    "requirementsEn" TEXT,
    "highlightsFa" TEXT,
    "highlightsEn" TEXT,
    "contactPhone" TEXT,
    "registrationDeadline" DATETIME,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isShowOnHome" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "branchId" TEXT,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "registrationOpenAt" DATETIME,
    "registrationCloseAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workshop_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkshopTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "amount" INTEGER,
    "registrationMethod" TEXT NOT NULL DEFAULT 'online',
    "registeredByAdminId" TEXT,
    "paymentRef" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkshopTicket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkshopTicket_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleFa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "contentFa" TEXT,
    "contentEn" TEXT,
    "type" TEXT NOT NULL DEFAULT 'info',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "coverUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isShowOnHome" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "addressFa" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "hoursFa" TEXT NOT NULL,
    "hoursEn" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "slugFa" TEXT NOT NULL,
    "slugEn" TEXT NOT NULL,
    "descriptionFa" TEXT,
    "descriptionEn" TEXT,
    "color" TEXT NOT NULL DEFAULT '#8B2252',
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleFa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "slugFa" TEXT NOT NULL,
    "slugEn" TEXT NOT NULL,
    "contentFa" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "excerptFa" TEXT,
    "excerptEn" TEXT,
    "coverUrl" TEXT,
    "coverAltFa" TEXT,
    "coverAltEn" TEXT,
    "tags" TEXT,
    "metaTitleFa" TEXT,
    "metaTitleEn" TEXT,
    "metaDescriptionFa" TEXT,
    "metaDescriptionEn" TEXT,
    "keywords" TEXT,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isShowOnHome" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "avgReadTime" REAL NOT NULL DEFAULT 0,
    "bounceRate" REAL NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "sizeKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "altFa" TEXT,
    "altEn" TEXT,
    "quality" INTEGER NOT NULL DEFAULT 80,
    "format" TEXT NOT NULL DEFAULT 'webp',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogPostToCategory" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("postId", "categoryId"),
    CONSTRAINT "BlogPostToCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogPostToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogPostDailyAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "avgReadTime" REAL NOT NULL DEFAULT 0,
    "avgReadProgress" REAL NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" REAL NOT NULL DEFAULT 0,
    "sourceDirect" INTEGER NOT NULL DEFAULT 0,
    "sourceSearch" INTEGER NOT NULL DEFAULT 0,
    "sourceSocial" INTEGER NOT NULL DEFAULT 0,
    "sourceReferral" INTEGER NOT NULL DEFAULT 0,
    "deviceDesktop" INTEGER NOT NULL DEFAULT 0,
    "deviceMobile" INTEGER NOT NULL DEFAULT 0,
    "deviceTablet" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogPostDailyAnalytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogViewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readProgress" REAL NOT NULL DEFAULT 0,
    "timeOnPage" INTEGER NOT NULL DEFAULT 0,
    "referrer" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "deviceType" TEXT NOT NULL DEFAULT 'desktop',
    "userAgent" TEXT,
    "country" TEXT,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogViewLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "altFa" TEXT,
    "altEn" TEXT,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'image',
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "thumbnailUrl" TEXT,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referenceId" TEXT,
    "description" TEXT,
    "relatedId" TEXT,
    "paidAt" DATETIME,
    "paymentType" TEXT NOT NULL DEFAULT 'full',
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "installmentPlanId" TEXT,
    "dueDate" DATETIME,
    "enrollmentId" TEXT,
    "ticketId" TEXT,
    "receivedBy" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titleFa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionFa" TEXT,
    "descriptionEn" TEXT,
    "type" TEXT NOT NULL DEFAULT 'practice',
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "courseId" TEXT,
    "instructorId" TEXT,
    "dueDate" DATETIME,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exercise_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exercise_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "grade" INTEGER,
    "feedback" TEXT,
    "submittedAt" DATETIME,
    "gradedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentExercise_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "branchId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "specificDate" DATETIME,
    "room" TEXT,
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cancelReason" TEXT,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    "notes" TEXT,
    "sessionNumber" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClassSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSchedule_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClassSchedule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instructorId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "proposedChanges" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminResponse" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduleChangeRequest_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleChangeRequest_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClassSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduleChangeRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleAvatarUrl" TEXT,
    "googleEmail" TEXT,
    "studentId" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "titleFa" TEXT,
    "titleEn" TEXT,
    "contentFa" TEXT NOT NULL,
    "contentEn" TEXT,
    "courseId" TEXT,
    "workshopId" TEXT,
    "instrument" TEXT,
    "source" TEXT NOT NULL DEFAULT 'contact',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InstructorFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instructorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "classScheduleId" TEXT,
    "teachingQuality" INTEGER NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "commentFa" TEXT,
    "commentEn" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentimentScore" REAL,
    "keywords" TEXT,
    "aiCategory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstructorFeedback_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InstructorFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "classScheduleId" TEXT,
    "instructorId" TEXT,
    "sessionDate" TEXT NOT NULL,
    "sessionNumber" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'present',
    "arrivalTime" TEXT,
    "notes" TEXT,
    "makeupForDate" TEXT,
    "isMakeup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebsiteEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "elementId" TEXT,
    "elementText" TEXT,
    "pagePath" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "screenWidth" INTEGER,
    "language" TEXT,
    "country" TEXT,
    "city" TEXT,
    "ipAddress" TEXT,
    "timeOnPage" INTEGER,
    "scrollDepth" REAL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "classScheduleId" TEXT,
    "classCode" TEXT,
    "instructorId" TEXT NOT NULL,
    "branchId" TEXT,
    "sessionDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sessionNumber" INTEGER,
    "totalEnrolled" INTEGER NOT NULL DEFAULT 0,
    "totalPresent" INTEGER NOT NULL DEFAULT 0,
    "totalAbsent" INTEGER NOT NULL DEFAULT 0,
    "totalLate" INTEGER NOT NULL DEFAULT 0,
    "sessionStatus" TEXT NOT NULL DEFAULT 'completed',
    "cancelReason" TEXT,
    "topics" TEXT,
    "notes" TEXT,
    "instructorPresent" BOOLEAN NOT NULL DEFAULT true,
    "startedOnTime" BOOLEAN NOT NULL DEFAULT true,
    "endedOnTime" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_email_idx" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_phone_idx" ON "Student"("phone");

-- CreateIndex
CREATE INDEX "Student_role_idx" ON "Student"("role");

-- CreateIndex
CREATE INDEX "Student_isActive_idx" ON "Student"("isActive");

-- CreateIndex
CREATE INDEX "Student_primaryInstrument_idx" ON "Student"("primaryInstrument");

-- CreateIndex
CREATE INDEX "Student_registrationInstrument_idx" ON "Student"("registrationInstrument");

-- CreateIndex
CREATE INDEX "Student_referralSource_idx" ON "Student"("referralSource");

-- CreateIndex
CREATE INDEX "Student_gender_idx" ON "Student"("gender");

-- CreateIndex
CREATE INDEX "Student_city_idx" ON "Student"("city");

-- CreateIndex
CREATE INDEX "Student_leadScore_idx" ON "Student"("leadScore");

-- CreateIndex
CREATE INDEX "Student_aiSegmentTag_idx" ON "Student"("aiSegmentTag");

-- CreateIndex
CREATE INDEX "Student_instructorNameKnown_idx" ON "Student"("instructorNameKnown");

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "Student"("createdAt");

-- CreateIndex
CREATE INDEX "Student_registrationStatus_idx" ON "Student"("registrationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_role_idx" ON "Admin"("role");

-- CreateIndex
CREATE INDEX "Admin_isActive_idx" ON "Admin"("isActive");

-- CreateIndex
CREATE INDEX "AdminPermission_adminId_idx" ON "AdminPermission"("adminId");

-- CreateIndex
CREATE INDEX "AdminPermission_resource_idx" ON "AdminPermission"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminId_resource_action_key" ON "AdminPermission"("adminId", "resource", "action");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoginSession_sessionToken_key" ON "LoginSession"("sessionToken");

-- CreateIndex
CREATE INDEX "LoginSession_adminId_idx" ON "LoginSession"("adminId");

-- CreateIndex
CREATE INDEX "LoginSession_studentId_idx" ON "LoginSession"("studentId");

-- CreateIndex
CREATE INDEX "LoginSession_isActive_idx" ON "LoginSession"("isActive");

-- CreateIndex
CREATE INDEX "LoginSession_ipAddress_idx" ON "LoginSession"("ipAddress");

-- CreateIndex
CREATE INDEX "LoginSession_loginAt_idx" ON "LoginSession"("loginAt");

-- CreateIndex
CREATE INDEX "AdminDevice_adminId_idx" ON "AdminDevice"("adminId");

-- CreateIndex
CREATE INDEX "AdminDevice_isApproved_idx" ON "AdminDevice"("isApproved");

-- CreateIndex
CREATE INDEX "AdminDevice_deviceFingerprint_idx" ON "AdminDevice"("deviceFingerprint");

-- CreateIndex
CREATE INDEX "IntrusionAlert_targetAdminId_idx" ON "IntrusionAlert"("targetAdminId");

-- CreateIndex
CREATE INDEX "IntrusionAlert_isResolved_idx" ON "IntrusionAlert"("isResolved");

-- CreateIndex
CREATE INDEX "IntrusionAlert_ipAddress_idx" ON "IntrusionAlert"("ipAddress");

-- CreateIndex
CREATE INDEX "IntrusionAlert_createdAt_idx" ON "IntrusionAlert"("createdAt");

-- CreateIndex
CREATE INDEX "AdminMessage_senderId_idx" ON "AdminMessage"("senderId");

-- CreateIndex
CREATE INDEX "AdminMessage_recipientId_idx" ON "AdminMessage"("recipientId");

-- CreateIndex
CREATE INDEX "AdminMessage_status_idx" ON "AdminMessage"("status");

-- CreateIndex
CREATE INDEX "AdminMessage_createdAt_idx" ON "AdminMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AdminMessage_recipientId_status_idx" ON "AdminMessage"("recipientId", "status");

-- CreateIndex
CREATE INDEX "BackupRecord_performedBy_idx" ON "BackupRecord"("performedBy");

-- CreateIndex
CREATE INDEX "BackupRecord_backupType_idx" ON "BackupRecord"("backupType");

-- CreateIndex
CREATE INDEX "BackupRecord_createdAt_idx" ON "BackupRecord"("createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_status_idx" ON "BackupRecord"("status");

-- CreateIndex
CREATE INDEX "PendingRegistration_status_idx" ON "PendingRegistration"("status");

-- CreateIndex
CREATE INDEX "PendingRegistration_phone_idx" ON "PendingRegistration"("phone");

-- CreateIndex
CREATE INDEX "PendingRegistration_nationalId_idx" ON "PendingRegistration"("nationalId");

-- CreateIndex
CREATE INDEX "PendingRegistration_createdAt_idx" ON "PendingRegistration"("createdAt");

-- CreateIndex
CREATE INDEX "PendingRegistration_reviewedAt_idx" ON "PendingRegistration"("reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_classCode_key" ON "Course"("classCode");

-- CreateIndex
CREATE INDEX "Course_isPublished_idx" ON "Course"("isPublished");

-- CreateIndex
CREATE INDEX "Course_isFeatured_idx" ON "Course"("isFeatured");

-- CreateIndex
CREATE INDEX "Course_isShowOnHome_idx" ON "Course"("isShowOnHome");

-- CreateIndex
CREATE INDEX "Course_instrument_idx" ON "Course"("instrument");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "Course"("level");

-- CreateIndex
CREATE INDEX "Course_classType_idx" ON "Course"("classType");

-- CreateIndex
CREATE INDEX "Course_registrationOpen_idx" ON "Course"("registrationOpen");

-- CreateIndex
CREATE INDEX "CourseEnrollment_studentId_idx" ON "CourseEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");

-- CreateIndex
CREATE INDEX "CourseEnrollment_registrationMethod_idx" ON "CourseEnrollment"("registrationMethod");

-- CreateIndex
CREATE INDEX "CourseEnrollment_paymentStatus_idx" ON "CourseEnrollment"("paymentStatus");

-- CreateIndex
CREATE INDEX "CourseEnrollment_paidAt_idx" ON "CourseEnrollment"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_studentId_courseId_key" ON "CourseEnrollment"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "Workshop_isPublished_idx" ON "Workshop"("isPublished");

-- CreateIndex
CREATE INDEX "Workshop_isFeatured_idx" ON "Workshop"("isFeatured");

-- CreateIndex
CREATE INDEX "Workshop_isShowOnHome_idx" ON "Workshop"("isShowOnHome");

-- CreateIndex
CREATE INDEX "Workshop_date_idx" ON "Workshop"("date");

-- CreateIndex
CREATE INDEX "Workshop_registrationOpen_idx" ON "Workshop"("registrationOpen");

-- CreateIndex
CREATE INDEX "WorkshopTicket_studentId_idx" ON "WorkshopTicket"("studentId");

-- CreateIndex
CREATE INDEX "WorkshopTicket_workshopId_idx" ON "WorkshopTicket"("workshopId");

-- CreateIndex
CREATE INDEX "WorkshopTicket_status_idx" ON "WorkshopTicket"("status");

-- CreateIndex
CREATE INDEX "WorkshopTicket_registrationMethod_idx" ON "WorkshopTicket"("registrationMethod");

-- CreateIndex
CREATE UNIQUE INDEX "WorkshopTicket_studentId_workshopId_key" ON "WorkshopTicket"("studentId", "workshopId");

-- CreateIndex
CREATE INDEX "Announcement_isPublished_idx" ON "Announcement"("isPublished");

-- CreateIndex
CREATE INDEX "Announcement_isFeatured_idx" ON "Announcement"("isFeatured");

-- CreateIndex
CREATE INDEX "Announcement_isShowOnHome_idx" ON "Announcement"("isShowOnHome");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_priority_idx" ON "Announcement"("priority");

-- CreateIndex
CREATE INDEX "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slugFa_key" ON "BlogCategory"("slugFa");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slugEn_key" ON "BlogCategory"("slugEn");

-- CreateIndex
CREATE INDEX "BlogCategory_order_idx" ON "BlogCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slugFa_key" ON "BlogPost"("slugFa");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slugEn_key" ON "BlogPost"("slugEn");

-- CreateIndex
CREATE INDEX "BlogPost_slugFa_idx" ON "BlogPost"("slugFa");

-- CreateIndex
CREATE INDEX "BlogPost_slugEn_idx" ON "BlogPost"("slugEn");

-- CreateIndex
CREATE INDEX "BlogPost_isPublished_idx" ON "BlogPost"("isPublished");

-- CreateIndex
CREATE INDEX "BlogPost_isFeatured_idx" ON "BlogPost"("isFeatured");

-- CreateIndex
CREATE INDEX "BlogPost_isShowOnHome_idx" ON "BlogPost"("isShowOnHome");

-- CreateIndex
CREATE INDEX "BlogPost_isPinned_idx" ON "BlogPost"("isPinned");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_sourceType_idx" ON "BlogPost"("sourceType");

-- CreateIndex
CREATE INDEX "BlogPost_createdAt_idx" ON "BlogPost"("createdAt");

-- CreateIndex
CREATE INDEX "BlogImage_postId_idx" ON "BlogImage"("postId");

-- CreateIndex
CREATE INDEX "BlogImage_sizeKey_idx" ON "BlogImage"("sizeKey");

-- CreateIndex
CREATE UNIQUE INDEX "BlogImage_postId_sizeKey_key" ON "BlogImage"("postId", "sizeKey");

-- CreateIndex
CREATE INDEX "BlogPostDailyAnalytics_postId_idx" ON "BlogPostDailyAnalytics"("postId");

-- CreateIndex
CREATE INDEX "BlogPostDailyAnalytics_date_idx" ON "BlogPostDailyAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostDailyAnalytics_postId_date_key" ON "BlogPostDailyAnalytics"("postId", "date");

-- CreateIndex
CREATE INDEX "BlogViewLog_postId_idx" ON "BlogViewLog"("postId");

-- CreateIndex
CREATE INDEX "BlogViewLog_viewedAt_idx" ON "BlogViewLog"("viewedAt");

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- CreateIndex
CREATE INDEX "Media_isUsed_idx" ON "Media"("isUsed");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE INDEX "Payment_studentId_idx" ON "Payment"("studentId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_type_idx" ON "Payment"("type");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_paymentType_idx" ON "Payment"("paymentType");

-- CreateIndex
CREATE INDEX "Payment_paymentMethod_idx" ON "Payment"("paymentMethod");

-- CreateIndex
CREATE INDEX "Payment_installmentPlanId_idx" ON "Payment"("installmentPlanId");

-- CreateIndex
CREATE INDEX "Payment_enrollmentId_idx" ON "Payment"("enrollmentId");

-- CreateIndex
CREATE INDEX "Exercise_courseId_idx" ON "Exercise"("courseId");

-- CreateIndex
CREATE INDEX "Exercise_instructorId_idx" ON "Exercise"("instructorId");

-- CreateIndex
CREATE INDEX "Exercise_isPublished_idx" ON "Exercise"("isPublished");

-- CreateIndex
CREATE INDEX "StudentExercise_studentId_idx" ON "StudentExercise"("studentId");

-- CreateIndex
CREATE INDEX "StudentExercise_exerciseId_idx" ON "StudentExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "StudentExercise_status_idx" ON "StudentExercise"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExercise_studentId_exerciseId_key" ON "StudentExercise"("studentId", "exerciseId");

-- CreateIndex
CREATE INDEX "ClassSchedule_courseId_idx" ON "ClassSchedule"("courseId");

-- CreateIndex
CREATE INDEX "ClassSchedule_instructorId_idx" ON "ClassSchedule"("instructorId");

-- CreateIndex
CREATE INDEX "ClassSchedule_branchId_idx" ON "ClassSchedule"("branchId");

-- CreateIndex
CREATE INDEX "ClassSchedule_dayOfWeek_idx" ON "ClassSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "ClassSchedule_status_idx" ON "ClassSchedule"("status");

-- CreateIndex
CREATE INDEX "ClassSchedule_isRecurring_idx" ON "ClassSchedule"("isRecurring");

-- CreateIndex
CREATE INDEX "ClassSchedule_specificDate_idx" ON "ClassSchedule"("specificDate");

-- CreateIndex
CREATE INDEX "ScheduleChangeRequest_instructorId_idx" ON "ScheduleChangeRequest"("instructorId");

-- CreateIndex
CREATE INDEX "ScheduleChangeRequest_scheduleId_idx" ON "ScheduleChangeRequest"("scheduleId");

-- CreateIndex
CREATE INDEX "ScheduleChangeRequest_courseId_idx" ON "ScheduleChangeRequest"("courseId");

-- CreateIndex
CREATE INDEX "ScheduleChangeRequest_status_idx" ON "ScheduleChangeRequest"("status");

-- CreateIndex
CREATE INDEX "ScheduleChangeRequest_requestType_idx" ON "ScheduleChangeRequest"("requestType");

-- CreateIndex
CREATE INDEX "ScheduleChangeRequest_createdAt_idx" ON "ScheduleChangeRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Testimonial_isPublished_idx" ON "Testimonial"("isPublished");

-- CreateIndex
CREATE INDEX "Testimonial_isApproved_idx" ON "Testimonial"("isApproved");

-- CreateIndex
CREATE INDEX "Testimonial_isFeatured_idx" ON "Testimonial"("isFeatured");

-- CreateIndex
CREATE INDEX "Testimonial_status_idx" ON "Testimonial"("status");

-- CreateIndex
CREATE INDEX "Testimonial_rating_idx" ON "Testimonial"("rating");

-- CreateIndex
CREATE INDEX "Testimonial_source_idx" ON "Testimonial"("source");

-- CreateIndex
CREATE INDEX "Testimonial_studentId_idx" ON "Testimonial"("studentId");

-- CreateIndex
CREATE INDEX "Testimonial_courseId_idx" ON "Testimonial"("courseId");

-- CreateIndex
CREATE INDEX "Testimonial_displayOrder_idx" ON "Testimonial"("displayOrder");

-- CreateIndex
CREATE INDEX "Testimonial_createdAt_idx" ON "Testimonial"("createdAt");

-- CreateIndex
CREATE INDEX "InstructorFeedback_instructorId_idx" ON "InstructorFeedback"("instructorId");

-- CreateIndex
CREATE INDEX "InstructorFeedback_studentId_idx" ON "InstructorFeedback"("studentId");

-- CreateIndex
CREATE INDEX "InstructorFeedback_courseId_idx" ON "InstructorFeedback"("courseId");

-- CreateIndex
CREATE INDEX "InstructorFeedback_overallRating_idx" ON "InstructorFeedback"("overallRating");

-- CreateIndex
CREATE INDEX "InstructorFeedback_status_idx" ON "InstructorFeedback"("status");

-- CreateIndex
CREATE INDEX "InstructorFeedback_createdAt_idx" ON "InstructorFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorFeedback_instructorId_studentId_courseId_key" ON "InstructorFeedback"("instructorId", "studentId", "courseId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId");

-- CreateIndex
CREATE INDEX "Attendance_courseId_idx" ON "Attendance"("courseId");

-- CreateIndex
CREATE INDEX "Attendance_instructorId_idx" ON "Attendance"("instructorId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE INDEX "Attendance_sessionDate_idx" ON "Attendance"("sessionDate");

-- CreateIndex
CREATE INDEX "Attendance_createdAt_idx" ON "Attendance"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_courseId_sessionDate_key" ON "Attendance"("studentId", "courseId", "sessionDate");

-- CreateIndex
CREATE INDEX "WebsiteEvent_eventType_idx" ON "WebsiteEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebsiteEvent_userId_idx" ON "WebsiteEvent"("userId");

-- CreateIndex
CREATE INDEX "WebsiteEvent_pagePath_idx" ON "WebsiteEvent"("pagePath");

-- CreateIndex
CREATE INDEX "WebsiteEvent_createdAt_idx" ON "WebsiteEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteEvent_utmSource_idx" ON "WebsiteEvent"("utmSource");

-- CreateIndex
CREATE INDEX "WebsiteEvent_relatedEntityType_idx" ON "WebsiteEvent"("relatedEntityType");

-- CreateIndex
CREATE INDEX "WebsiteEvent_relatedEntityId_idx" ON "WebsiteEvent"("relatedEntityId");

-- CreateIndex
CREATE INDEX "SessionLog_courseId_idx" ON "SessionLog"("courseId");

-- CreateIndex
CREATE INDEX "SessionLog_instructorId_idx" ON "SessionLog"("instructorId");

-- CreateIndex
CREATE INDEX "SessionLog_branchId_idx" ON "SessionLog"("branchId");

-- CreateIndex
CREATE INDEX "SessionLog_sessionDate_idx" ON "SessionLog"("sessionDate");

-- CreateIndex
CREATE INDEX "SessionLog_sessionStatus_idx" ON "SessionLog"("sessionStatus");

-- CreateIndex
CREATE INDEX "SessionLog_classCode_idx" ON "SessionLog"("classCode");

-- CreateIndex
CREATE INDEX "SessionLog_createdAt_idx" ON "SessionLog"("createdAt");

