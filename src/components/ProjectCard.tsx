export interface ProjectLink {
	label: string;
	url: string;
}

export interface ProjectItem {
	title: string;
	slug: string;
	description: string;
	tags: string[];
	links?: ProjectLink[];
}

type TagColor = {
	bg: string;
	text: string;
};

interface ProjectCardProps {
	project: ProjectItem;
	isDarkMode: boolean;
	getTagColor: (tag: string) => TagColor;
	roomy?: boolean;
}

import { Link } from 'react-router-dom';

export default function ProjectCard({ project, isDarkMode, getTagColor, roomy = false }: ProjectCardProps) {
	
	return (
		<div
			className={`${
				roomy ? 'p-6 md:p-8 rounded-xl hover:scale-[1.02]' : 'p-4 md:p-6 rounded-lg hover:scale-105'
			} shadow-lg transition-transform transform ${
				isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
			}`}
		>
			<h3 className={`${roomy ? 'mb-3 text-xl md:text-2xl' : 'mb-2 text-lg md:text-xl'} font-bold`}>{project.title}</h3>
			<p className={`${roomy ? 'mb-5 text-base md:text-lg leading-relaxed' : 'mb-4 text-sm md:text-base'}`}>
				{project.description}
			</p>

			<div className={`${roomy ? 'gap-2.5 mb-6' : 'gap-2 mb-4'} flex flex-wrap`}>
				{project.tags.map((tag) => {
					const colors = getTagColor(tag);
					return (
						<span
							key={`${project.title}-${tag}`}
							className={`${roomy ? 'px-3 py-1' : 'px-2.5 py-0.5'} text-xs font-semibold rounded ${colors.bg} ${colors.text}`}
						>
							{tag}
						</span>
					);
				})}
			</div>

			{project.links && project.links.length > 0 && (
				<div className={`${roomy ? 'gap-3' : 'gap-2'} flex flex-col`}>
					{project.links.map((link) => {
						const isGitHub = link.label.toLowerCase().includes('github');
						const isVisit = link.label.toLowerCase().includes('visit');
						return (
							<a
								key={`${project.title}-${link.label}`}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								className={`${
									roomy ? 'px-4 py-2.5 font-medium' : 'px-3 py-2'
								} flex items-center justify-center gap-2 rounded text-sm transition ${
									isGitHub ? 'bg-gray-900 hover:bg-gray-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
								}`}
							>
								{isGitHub && (
									<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 .5C5.648.5.5 5.648.5 12c0 5.086 3.292 9.396 7.86 10.93.574.106.786-.25.786-.554 0-.273-.01-1.004-.015-1.97-3.2.696-3.875-1.544-3.875-1.544-.523-1.33-1.277-1.684-1.277-1.684-1.043-.714.08-.7.08-.7 1.152.08 1.756 1.184 1.756 1.184 1.025 1.754 2.69 1.247 3.344.954.104-.743.4-1.247.727-1.534-2.553-.29-5.238-1.277-5.238-5.683 0-1.255.448-2.28 1.184-3.084-.12-.29-.512-1.457.112-3.037 0 0 .96-.307 3.144 1.176a10.94 10.94 0 0 1 5.728 0c2.184-1.483 3.144-1.176 3.144-1.176.624 1.58.232 2.747.112 3.037.736.804 1.184 1.83 1.184 3.084 0 4.417-2.69 5.39-5.252 5.673.408.352.776 1.048.776 2.112 0 1.526-.015 2.756-.015 3.13 0 .308.208.666.792.554C20.708 21.396 24 17.086 24 12 24 5.648 18.352.5 12 .5z" />
									</svg>
								)}
								{isVisit && (
									<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
										/>
									</svg>
								)}
								{link.label}
							</a>
						);
					})}
				</div>
			)}

			{/* View Details Button */}
			<Link
				to={`/projects/${project.slug}`}
				className={`${
					roomy ? 'mt-6 px-4 py-2.5 font-medium' : 'mt-4 px-3 py-2'
				} flex items-center justify-center gap-2 rounded text-sm font-medium transition ${
					isDarkMode
						? 'bg-purple-600 hover:bg-purple-700 text-white'
						: 'bg-purple-500 hover:bg-purple-600 text-white'
				}`}
			>
				<svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				View Details
			</Link>
		</div>
	);
}
