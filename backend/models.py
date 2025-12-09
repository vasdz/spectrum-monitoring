from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date, Text, Numeric, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime


# 1. Departments (Кафедры)
class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, nullable=False)
    full_name = Column(String(100))

    groups = relationship("Group", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")


# 2. Groups (Группы)
class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    admission_year = Column(Integer)
    group_number = Column(Integer)
    degree_type = Column(String(20))
    curator_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)

    department = relationship("Department", back_populates="groups")
    students = relationship("Student", back_populates="group")


# 3. Teachers (Преподаватели)
class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    degree = Column(String(50), nullable=True)

    department = relationship("Department", back_populates="teachers")


# 4. Students (Студенты)
class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    student_ticket = Column(String(20), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"))

    debts_count = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)

    stat_int = Column(Integer, default=50)
    stat_sta = Column(Integer, default=50)
    stat_soc = Column(Integer, default=50)

    # --- ELO RATING ---
    elo_rating = Column(Integer, nullable=False, default=1000)
    status = Column(String(20), default='STUDYING')

    group = relationship("Group", back_populates="students")
    grades = relationship("Grade", back_populates="student")
    achievements = relationship("StudentAchievement", back_populates="student")
    user_account = relationship("User", back_populates="profile", uselist=False)
    titles = relationship("StudentTitle", back_populates="student")


# 5. Users (Авторизация)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20))
    student_profile_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Student", back_populates="user_account")


class EloHistory(Base):
    __tablename__ = "elo_history"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    prev_rating = Column(Integer)
    new_rating = Column(Integer)
    change_amount = Column(Integer)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.now)


# 6. Grades (Оценки)
class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_name = Column(String(100), nullable=False)
    score = Column(Integer)
    is_exam = Column(Boolean, default=True)
    is_debt = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="grades")


# 7. Achievements (Справочник)
class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True)
    title = Column(String(100))
    description = Column(Text)
    xp_reward = Column(Integer, default=100)


# 8. Student Achievements (Связь)
class StudentAchievement(Base):
    __tablename__ = "student_achievements"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    achievement_code = Column(String)
    earned_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="achievements")


# 9. Titles (Справочник Титулов)
class Title(Base):
    __tablename__ = "titles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    color = Column(String(50))
    rarity = Column(String(20))


# 10. Student Titles (Связь)
class StudentTitle(Base):
    __tablename__ = "student_titles"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    title_id = Column(Integer, ForeignKey("titles.id"))
    assigned_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="titles")
    title = relationship("Title")


# 11. Activity Logs
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    event_type = Column(String(50))
    severity = Column(String(20), default='INFO')
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


# 12. Security Alerts
class SecurityAlert(Base):
    __tablename__ = "security_alerts"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), default='WARNING')
    message = Column(Text)
    source = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
