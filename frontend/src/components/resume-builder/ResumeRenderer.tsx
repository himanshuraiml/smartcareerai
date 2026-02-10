
import React from 'react';
import {
    Briefcase,
    GraduationCap,
    Mail,
    Phone,
    Linkedin,
    Globe,
    MapPin,
    Award,
    BookOpen,
    Activity,
    Heart,
    FileText
} from 'lucide-react';

// Shared Types (should ideally be in a types file)
interface ResumeData {
    personal: {
        fullName: string;
        email: string;
        phone: string;
        linkedin: string;
        portfolio: string;
        summary: string;
    };
    experience: Array<{
        id: string;
        company: string;
        role: string;
        startDate: string;
        endDate: string;
        current: boolean;
        description: string;
    }>;
    education: Array<{
        id: string;
        school: string;
        degree: string;
        field: string;
        startDate: string;
        endDate: string;
        grade: string;
    }>;
    skills: string[];
    internships: Array<{
        id: string;
        company: string;
        role: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    projects: Array<{
        id: string;
        title: string;
        description: string;
        technologies: string[];
        link: string;
    }>;
    certifications: Array<{
        id: string;
        name: string;
        issuer: string;
        date: string;
        link: string;
    }>;
    industrialTraining: Array<{
        id: string;
        organization: string;
        project: string;
        startDate: string;
        endDate: string;
        description: string;
    }>;
    publications: Array<{
        id: string;
        title: string;
        publisher: string;
        date: string;
        link: string;
    }>;
    awards: Array<{
        id: string;
        title: string;
        date: string;
        issuer: string;
    }>;
    coCurricular: string[];
    industrialVisits: Array<{
        id: string;
        company: string;
        date: string;
        description: string;
    }>;
    hobbies: string[];
}

interface RendererProps {
    templateId: string;
    data: ResumeData;
    id?: string;
}

// ----------------------------------------------------------------------
// Modern Template (Clean, ATS-Friendly, Stacked)
// ----------------------------------------------------------------------
const ModernTemplate = ({ data }: { data: ResumeData }) => (
    <div className="font-sans text-gray-800 p-8 max-w-[800px] mx-auto bg-white min-h-[1100px]">
        {/* Header */}
        <header className="border-b-2 border-gray-800 pb-6 mb-6">
            <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-900 mb-2">{data.personal.fullName}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {data.personal.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.personal.email}</span>
                )}
                {data.personal.phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.personal.phone}</span>
                )}
                {data.personal.linkedin && (
                    <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" /> {data.personal.linkedin}</span>
                )}
                {data.personal.portfolio && (
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {data.personal.portfolio}</span>
                )}
            </div>
        </header>

        {/* Summary */}
        {data.personal.summary && (
            <section className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-3 pb-1">Professional Summary</h2>
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{data.personal.summary}</p>
            </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
            <section className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Experience</h2>
                <div className="space-y-5">
                    {data.experience.map((exp) => (
                        <div key={exp.id}>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-900 text-base">{exp.role}</h3>
                                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{exp.startDate} - {exp.endDate || 'Present'}</span>
                            </div>
                            <div className="text-sm text-gray-700 font-semibold mb-1">{exp.company}</div>
                            <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{exp.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
            <section className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Education</h2>
                <div className="space-y-4">
                    {data.education.map((edu) => (
                        <div key={edu.id}>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-gray-900 text-base">{edu.school}</h3>
                                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{edu.startDate} - {edu.endDate}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-700">
                                <span>{edu.degree} in {edu.field}</span>
                                {edu.grade && <span className="text-gray-600 font-medium">Grade: {edu.grade}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        {/* New Sections for Flexible Layout */}
        <div className="grid grid-cols-1 gap-6">

            {/* Internships */}
            {data.internships.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Internships</h2>
                    <div className="space-y-4">
                        {data.internships.map((int) => (
                            <div key={int.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-900 text-base">{int.role}</h3>
                                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{int.startDate} - {int.endDate}</span>
                                </div>
                                <div className="text-sm text-gray-700 font-semibold mb-1">{int.company}</div>
                                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{int.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Projects */}
            {data.projects.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Projects</h2>
                    <div className="space-y-4">
                        {data.projects.map((proj) => (
                            <div key={proj.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-900 text-base">
                                        {proj.title}
                                        {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 text-xs font-normal underline">Link</a>}
                                    </h3>
                                </div>
                                {(proj.technologies?.length > 0) && (
                                    <div className="text-xs text-gray-500 mb-1 italic">
                                        Stack: {proj.technologies.join(', ')}
                                    </div>
                                )}
                                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{proj.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Industrial Training */}
            {data.industrialTraining.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Industrial Training</h2>
                    <div className="space-y-4">
                        {data.industrialTraining.map((tr) => (
                            <div key={tr.id}>
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-900 text-base">{tr.project}</h3>
                                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{tr.startDate} - {tr.endDate}</span>
                                </div>
                                <div className="text-sm text-gray-700 font-semibold mb-1">{tr.organization}</div>
                                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{tr.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Certifications & Publications Grid */}
            {(data.certifications.length > 0 || data.publications.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.certifications.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Certifications</h2>
                            <ul className="space-y-3">
                                {data.certifications.map((cert) => (
                                    <li key={cert.id} className="text-sm">
                                        <div className="font-bold text-gray-900">{cert.name}</div>
                                        <div className="text-gray-600">{cert.issuer} • {cert.date}</div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {data.publications.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Publications</h2>
                            <ul className="space-y-3">
                                {data.publications.map((pub) => (
                                    <li key={pub.id} className="text-sm">
                                        <div className="font-bold text-gray-900">{pub.title}</div>
                                        <div className="text-gray-600">{pub.publisher} • {pub.date}</div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}

            {/* Awards & Co-curricular */}
            {(data.awards.length > 0 || data.coCurricular.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.awards.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Awards</h2>
                            <ul className="space-y-2">
                                {data.awards.map((aw) => (
                                    <li key={aw.id} className="text-sm">
                                        <span className="font-bold text-gray-900">{aw.title}</span>
                                        <span className="text-gray-600 block text-xs">{aw.issuer} • {aw.date}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {data.coCurricular.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Co-curricular</h2>
                            <ul className="list-disc ml-5 space-y-1">
                                {data.coCurricular.map((act, i) => (
                                    <li key={i} className="text-sm text-gray-700">{act}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}

            {/* Industrial Visits & Hobbies */}
            {(data.industrialVisits.length > 0 || data.hobbies.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.industrialVisits.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Industrial Visits</h2>
                            <ul className="space-y-3">
                                {data.industrialVisits.map((iv) => (
                                    <li key={iv.id} className="text-sm">
                                        <div className="font-bold text-gray-900">{iv.company}</div>
                                        <div className="text-gray-600 text-xs mb-1">{iv.date}</div>
                                        <div className="text-gray-700 text-xs">{iv.description}</div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    {data.hobbies.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-4 pb-1">Hobbies</h2>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                {data.hobbies.join(' • ')}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
            <section className="mt-6 mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 border-b border-gray-300 mb-3 pb-1">Skills</h2>
                <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium rounded">
                            {skill}
                        </span>
                    ))}
                </div>
            </section>
        )}
    </div>
);

// ----------------------------------------------------------------------
// Student Template (Minimalist, Education-First, Compact)
// ----------------------------------------------------------------------
const StudentTemplate = ({ data }: { data: ResumeData }) => (
    <div className="font-serif text-gray-900 p-8 max-w-[800px] mx-auto bg-white min-h-[1100px]">
        {/* Centered Minimal Header */}
        <header className="text-center border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold tracking-widest uppercase mb-3">{data.personal.fullName}</h1>
            <div className="flex justify-center flex-wrap gap-4 text-sm text-gray-500 italic">
                {data.personal.email} • {data.personal.phone}
                {data.personal.linkedin && ` • ${data.personal.linkedin}`}
            </div>
        </header>

        {/* 2-Col Layout for top section */}
        <div className="grid grid-cols-3 gap-8 mb-6">
            {/* Left Col: Education & Skills (1/3) */}
            <div className="col-span-1 border-r border-gray-200 pr-4 space-y-6">
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-3 bg-gray-100 p-1 inline-block">Education</h2>
                    <div className="space-y-4">
                        {data.education.map((edu) => (
                            <div key={edu.id}>
                                <div className="font-bold text-sm">{edu.school}</div>
                                <div className="text-xs italic text-gray-600">{edu.startDate} - {edu.endDate}</div>
                                <div className="text-xs mt-1">{edu.degree}</div>
                                <div className="text-xs text-gray-500">{edu.field}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-3 bg-gray-100 p-1 inline-block">Skills</h2>
                    <div className="text-xs leading-relaxed">
                        {data.skills.join(', ')}
                    </div>
                </section>

                {data.certifications.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-3 bg-gray-100 p-1 inline-block">Certifications</h2>
                        <div className="space-y-2">
                            {data.certifications.map(cert => (
                                <div key={cert.id} className="text-xs">
                                    <div className="font-semibold">{cert.name}</div>
                                    <div className="text-gray-500">{cert.issuer}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.hobbies.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-3 bg-gray-100 p-1 inline-block">Interests</h2>
                        <div className="text-xs leading-relaxed text-gray-600">
                            {data.hobbies.join(', ')}
                        </div>
                    </section>
                )}
            </div>

            {/* Right Col: Main Content (2/3) */}
            <div className="col-span-2 space-y-6">
                {data.personal.summary && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">Profile</h2>
                        <p className="text-sm text-gray-900 leading-relaxed text-justify">{data.personal.summary}</p>
                    </section>
                )}

                {/* Projects (Highlighted for Students) */}
                {data.projects.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-1">Academic Projects</h2>
                        <div className="space-y-5">
                            {data.projects.map((proj) => (
                                <div key={proj.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-gray-900 text-sm">{proj.title}</h3>
                                        {proj.link && <a href={proj.link} className="text-xs text-blue-600 underline">View</a>}
                                    </div>
                                    <p className="text-xs text-gray-800 leading-relaxed">{proj.description}</p>
                                    <div className="mt-1 text-xs text-gray-500 italic">[{proj.technologies?.join(', ')}]</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Internships */}
                {data.internships.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-1">Internships</h2>
                        <div className="space-y-5">
                            {data.internships.map((int) => (
                                <div key={int.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-gray-900 text-sm">{int.role}</h3>
                                        <span className="text-xs text-gray-500">{int.startDate} - {int.endDate}</span>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">{int.company}</div>
                                    <p className="text-xs text-gray-800 leading-relaxed">{int.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Experience (if any) */}
                {data.experience.length > 0 && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-1">Work History</h2>
                        <div className="space-y-4">
                            {data.experience.map((exp) => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-gray-900 text-sm">{exp.role}</h3>
                                        <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">{exp.company}</div>
                                    <p className="text-xs text-gray-800 leading-relaxed">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Co-curricular & Awards */}
                {(data.coCurricular.length > 0 || data.awards.length > 0) && (
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-1">Activities & Awards</h2>
                        <div className="grid grid-cols-1 gap-2 text-xs text-gray-800">
                            {data.awards.map(aw => (
                                <div key={aw.id} className="flex gap-2">
                                    <Award className="w-3 h-3 text-gray-400" />
                                    <span><span className="font-bold">{aw.title}</span> - {aw.issuer} ({aw.date})</span>
                                </div>
                            ))}
                            {data.coCurricular.map((act, i) => (
                                <div key={i} className="flex gap-2">
                                    <Activity className="w-3 h-3 text-gray-400" />
                                    <span>{act}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    </div>
);

// ----------------------------------------------------------------------
// Creative Template (Sidebar, Colors)
// ----------------------------------------------------------------------
const CreativeTemplate = ({ data }: { data: ResumeData }) => (
    <div className="font-sans flex h-full min-h-[1100px] w-full max-w-[800px] mx-auto bg-white">
        {/* Left Sidebar (Dark Blue) */}
        <div className="w-[30%] bg-slate-900 text-white p-6 flex flex-col gap-6">
            <div className="text-center mb-4">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-600 mx-auto flex items-center justify-center text-3xl font-bold mb-4">
                    {data.personal.fullName.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-xs uppercase tracking-widest opacity-70 mb-2">Contact</h2>
                <div className="space-y-2 text-xs text-slate-300">
                    <p className="flex items-center gap-2 justify-center"><Mail className="w-3 h-3" /> <span className="truncate max-w-[120px]">{data.personal.email}</span></p>
                    <p className="flex items-center gap-2 justify-center"><Phone className="w-3 h-3" /> {data.personal.phone}</p>
                    <p className="flex items-center gap-2 justify-center"><Linkedin className="w-3 h-3" /> <span className="truncate max-w-[120px]">LinkedIn</span></p>
                </div>
            </div>

            {/* Skills Bars */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Skills</h3>
                <div className="space-y-3">
                    {data.skills.slice(0, 8).map(skill => (
                        <div key={skill}>
                            <div className="text-xs mb-1 text-slate-300">{skill}</div>
                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[85%] rounded-full" />
                            </div>
                        </div>
                    ))}
                    {data.skills.length > 8 && <div className="text-xs text-slate-500 italic">+ {data.skills.length - 8} more skills</div>}
                </div>
            </div>

            {/* Education Sidebar */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Education</h3>
                <div className="space-y-4">
                    {data.education.map(edu => (
                        <div key={edu.id}>
                            <div className="text-xs font-bold text-white">{edu.degree}</div>
                            <div className="text-xs text-slate-400">{edu.school}</div>
                            <div className="text-[10px] text-slate-500">{edu.startDate} - {edu.endDate}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hobbies / Interests */}
            {data.hobbies.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                        {data.hobbies.map(h => (
                            <span key={h} className="text-[10px] px-2 py-1 bg-slate-800 rounded-full text-slate-300 border border-slate-700">{h}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Right Content */}
        <div className="w-[70%] p-8 bg-slate-50 relative">
            <header className="mb-10 text-left">
                <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-2 uppercase">{data.personal.fullName.split(' ')[0]} <br /><span className="text-blue-600">{data.personal.fullName.split(' ').slice(1).join(' ')}</span></h1>
                <p className="text-lg text-slate-500 tracking-wide font-light">
                    {data.personal.portfolio || data.experience[0]?.role || 'Professional Portfolio'}
                </p>
            </header>

            <div className="space-y-8">
                {/* Profile */}
                {data.personal.summary && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">
                            <span className="w-8 h-1 bg-blue-600"></span> Profile
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify">
                            {data.personal.summary}
                        </p>
                    </section>
                )}

                {/* Experience */}
                {data.experience.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
                            <span className="w-8 h-1 bg-blue-600"></span> Experience
                        </h3>
                        <div className="border-l-2 border-slate-200 ml-2 space-y-6">
                            {data.experience.map(exp => (
                                <div key={exp.id} className="pl-6 relative">
                                    <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1.5 border-2 border-slate-50" />
                                    <h4 className="font-bold text-slate-900">{exp.role}</h4>
                                    <div className="text-sm text-blue-600 font-medium mb-1">{exp.company} <span className="text-slate-400 text-xs">| {exp.startDate} - {exp.endDate}</span></div>
                                    <p className="text-sm text-slate-600">{exp.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Projects / Portfolio Grid */}
                {data.projects.length > 0 && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
                            <span className="w-8 h-1 bg-blue-600"></span> Key Projects
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {data.projects.map(proj => (
                                <div key={proj.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                    <h4 className="font-bold text-slate-800 flex justify-between items-center">
                                        {proj.title}
                                        {proj.link && <Globe className="w-3 h-3 text-blue-400" />}
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{proj.description}</p>
                                    <div className="mt-3 flex gap-1 flex-wrap">
                                        {proj.technologies?.map(t => <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Awards, Publications (Grouped) */}
                {(data.awards.length > 0 || data.publications.length > 0) && (
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 uppercase mb-4 flex items-center gap-2">
                            <span className="w-8 h-1 bg-blue-600"></span> Achievements
                        </h3>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                            {data.awards.map(aw => (
                                <div key={aw.id} className="flex gap-3 items-start">
                                    <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{aw.title}</div>
                                        <div className="text-xs text-slate-500">{aw.issuer} • {aw.date}</div>
                                    </div>
                                </div>
                            ))}
                            {data.publications.map(pub => (
                                <div key={pub.id} className="flex gap-3 items-start">
                                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-800">{pub.title}</div>
                                        <div className="text-xs text-slate-500">{pub.publisher}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    </div>
);


// ----------------------------------------------------------------------
// Main Renderer Component
// ----------------------------------------------------------------------
export default function ResumeRenderer({ templateId, data, id = 'resume-preview' }: RendererProps) {
    const renderTemplate = () => {
        switch (templateId) {
            case 'modern':
                return <ModernTemplate data={data} />;
            case 'student':
                return <StudentTemplate data={data} />;
            case 'creative':
                return <CreativeTemplate data={data} />;
            case 'minimal':
                // Re-use student or modern for minimal for now, or create separate one. 
                // Student template closely matches minimal style.
                return <StudentTemplate data={data} />;
            default:
                return <ModernTemplate data={data} />;
        }
    };

    return (
        <div
            id={id}
            className="w-full h-full bg-white text-black overflow-hidden shadow-2xl print:shadow-none print:m-0"
            // Ensure exact A4 styling if needed or rely on parent scaling
            style={{
                margin: '0 auto',
                boxSizing: 'border-box'
            }}
        >
            {renderTemplate()}
        </div>
    );
}

