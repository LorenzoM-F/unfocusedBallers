import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your Profile</h1>
      </div>
      {user ? (
        <div className="space-y-2 text-sm text-black/70">
          <p>
            <span className="uppercase tracking-[0.2em] text-black/50">Name:</span>{" "}
            {user.fullName}
          </p>
          <p>
            <span className="uppercase tracking-[0.2em] text-black/50">Email:</span>{" "}
            {user.email}
          </p>
          <p>
            <span className="uppercase tracking-[0.2em] text-black/50">Role:</span>{" "}
            {user.role}
          </p>
        </div>
      ) : (
        <p className="text-black/70">No profile data available.</p>
      )}
    </section>
  );
};

export default Profile;
