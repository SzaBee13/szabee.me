import { useTheme } from '../hooks/useTheme';

export const Socials = () => {
  const { isDarkMode } = useTheme();

  const socials = [
    {
      name: 'YouTube',
      iconName: 'yt_icon_white_digital',
      iconLink: '/icons/socials/yt_icon_white_digital.png',
      iconType: 'image/png',
      link: 'https://www.youtube.com/@WizardGuruYT',
      color: 'bg-red-500 hover:bg-red-600',
    },
    {
      name: 'Twitch',
      iconName: 'twitch_glitch_flat_white',
      iconLink: '/icons/socials/twitch_glitch_flat_white.svg',
      iconType: 'image/svg+xml',
      link: 'https://www.twitch.tv/wizardguru',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      name: 'Discord',
      iconName: 'discord-symbol-white',
      iconLink: '/icons/socials/Discord-Symbol-White.svg',
      iconType: 'image/svg+xml',
      link: 'https://discord.gg/num6hCEhxr',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: 'GitHub',
      iconName: 'github_invertocat_white',
      iconLink: '/icons/socials/GitHub_Invertocat_White.svg',
      iconType: 'image/svg+xml',
      link: 'https://github.com/SzaBee13',
      color: 'bg-gray-800 hover:bg-gray-700',
    },
    {
      name: 'Docker',
      iconName: 'docker-mark-white',
      iconLink: '/icons/socials/docker-mark-white.svg',
      iconType: 'image/svg+xml',
      link: 'https://hub.docker.com/u/szabee13',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: 'Reddit',
      iconName: 'reddit_icon_fullcolor',
      iconLink: '/icons/socials/Reddit_Icon_FullColor.svg',
      iconType: 'image/svg+xml',
      link: 'https://www.reddit.com/user/SzaBee13',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      name: 'Email',
      iconName: 'email_open_white',
      iconLink: '/icons/socials/email_open_white.svg',
      iconType: 'image/svg+xml',
      link: 'mailto:me@szabee.me',
      color: 'bg-gray-500 hover:bg-gray-600',
    },
  ];

  return (
    <section
      id="socials"
      className={`flex flex-col items-center py-12  ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
    >
      <div className="w-full px-4">
        <h2 className="mb-8 text-2xl font-bold text-center md:text-3xl">Socials</h2>
        <div className="flex flex-col flex-wrap items-center justify-center w-full gap-4 space-y-4 md:flex-row md:space-y-0 md:space-x-6">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center text-white px-4 py-2 rounded-full transition duration-300 ease-in-out shadow-lg ${social.color}`}
            >
              <img
                src={social.iconLink}
                alt={`${social.name} icon`}
                className={'w-6 h-6'}
              />
              <span className="ml-2">{social.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
